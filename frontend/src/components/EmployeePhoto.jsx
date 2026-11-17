import React, { useEffect, useState, useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { apiFetch } from '../utils/api';

const MAX_BYTES = 80 * 1024; // target size ceiling for the stored JPEG
const MAX_SIDE = 320;        // longest side in pixels

// Shrinks any picked image to a small JPEG (about 20-80 KB) and returns a data URL.
export async function compressImageFile(file) {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not read that image'));
      i.src = bitmapUrl;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let quality = 0.85;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length * 0.75 > MAX_BYTES && quality > 0.3) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

const photoCache = new Map();
export const clearPhotoCache = (employeeId) => photoCache.delete(String(employeeId));

// Loads one employee's photo from the server (only when needed, then cached).
export function useEmployeePhoto(employeeId) {
  const [photo, setPhoto] = useState(() => (employeeId ? photoCache.get(String(employeeId)) || null : null));
  useEffect(() => {
    if (!employeeId) { setPhoto(null); return; }
    const key = String(employeeId);
    if (photoCache.has(key)) { setPhoto(photoCache.get(key)); return; }
    let cancelled = false;
    apiFetch(`employees/${encodeURIComponent(key)}/photo`)
      .then(r => { photoCache.set(key, r.photo || null); if (!cancelled) setPhoto(r.photo || null); })
      .catch(() => { if (!cancelled) setPhoto(null); });
    return () => { cancelled = true; };
  }, [employeeId]);
  return photo;
}

// Shows the photo if there is one, otherwise whatever children you pass as the fallback.
export function EmployeePhoto({ employeeId, className = '', children }) {
  const photo = useEmployeePhoto(employeeId);
  if (!photo) return children || null;
  return <img src={photo} alt="" className={`object-cover ${className}`} />;
}

// Form control. value: undefined = leave unchanged, null = remove, string = new photo (data URL).
export function PhotoPicker({ employeeId, value, onChange }) {
  const existing = useEmployeePhoto(value === undefined ? employeeId : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const shown = value === undefined ? existing : value;

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose an image file'); return; }
    try {
      setBusy(true); setError('');
      onChange(await compressImageFile(file));
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 border rounded-xl">
      <div className="w-16 h-16 rounded-xl bg-white border flex items-center justify-center overflow-hidden shrink-0">
        {shown ? <img src={shown} alt="Employee" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-slate-300" />}
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="font-semibold">Employee Photo <span className="font-normal text-slate-400">(optional, auto-resized to under 80 KB)</span></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={busy} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-bold cursor-pointer disabled:opacity-60">
            {busy ? 'Processing...' : (shown ? 'Change Photo' : 'Choose / Take Photo')}
          </button>
          {shown && (
            <button type="button" onClick={() => onChange(null)} className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
        {error && <div className="text-rose-600">{error}</div>}
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
    </div>
  );
}

// Saves/removes the photo for an employee after the employee record itself is saved.
export async function persistEmployeePhoto(employeeId, photo) {
  if (photo === undefined) return;
  const id = encodeURIComponent(String(employeeId).trim());
  if (photo === null) await apiFetch(`employees/${id}/photo`, 'DELETE');
  else await apiFetch(`employees/${id}/photo`, 'PUT', { photo });
  clearPhotoCache(String(employeeId).trim());
}
