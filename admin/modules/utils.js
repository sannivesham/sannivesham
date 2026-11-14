/**
 * Sannivesham Admin Dashboard — Utilities Module
 * Safe HTML escaping, Cloudinary uploads with signature fallback, and audio timestamps.
 */

export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const CLOUD_NAME = "du5em76za";
export const UPLOAD_PRESET = "sannivesham_upload";

export async function getSignedUploadParams(auth) {
  try {
    if (auth && auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      const resp = await fetch("https://us-central1-sannivesham-b4231.cloudfunctions.net/getCloudinaryUploadSignature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (resp.ok) {
        return await resp.json();
      }
    }
  } catch (e) {
    console.warn("Could not retrieve signed upload params:", e);
  }
  return null;
}

export function uploadImage(auth) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return resolve(null);

      const signedParams = await getSignedUploadParams(auth);
      const formData = new FormData();
      formData.append("file", file);

      if (signedParams && signedParams.signature) {
        formData.append("api_key", signedParams.apiKey);
        formData.append("timestamp", signedParams.timestamp);
        formData.append("signature", signedParams.signature);
        formData.append("folder", signedParams.folder);
      } else {
        formData.append("upload_preset", UPLOAD_PRESET);
      }

      const activeCloud = signedParams?.cloudName || CLOUD_NAME;
      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${activeCloud}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        resolve(data.secure_url);
      } catch (e) {
        resolve(null);
      }
    };
    input.click();
  });
}

export function uploadAudioFile(boxOrId = null, auth = null) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return resolve(null);

      const box = typeof boxOrId === "string" ? document.getElementById(boxOrId) : boxOrId;
      const statusText = document.createElement("span");
      statusText.innerText = "⏳ ఆడియో అప్‌లోడ్ అవుతోంది...";
      statusText.style.color = "#ffd166";
      statusText.style.display = "block";
      statusText.style.fontWeight = "bold";
      statusText.style.padding = "6px 0";
      if (box) box.appendChild(statusText);

      const signedParams = await getSignedUploadParams(auth);
      const formData = new FormData();
      formData.append("file", file);

      if (signedParams && signedParams.signature) {
        formData.append("api_key", signedParams.apiKey);
        formData.append("timestamp", signedParams.timestamp);
        formData.append("signature", signedParams.signature);
        formData.append("folder", signedParams.folder);
      } else {
        formData.append("upload_preset", UPLOAD_PRESET);
      }

      const activeCloud = signedParams?.cloudName || CLOUD_NAME;
      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${activeCloud}/video/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        if (!res.ok || !data.secure_url) throw new Error(data?.error?.message || "Audio upload failed");
        resolve(data.secure_url);
      } catch (error) {
        alert("Audio upload failed: " + error.message);
        resolve(null);
      } finally {
        statusText.remove();
      }
    };

    input.click();
  });
}

export function formatSecondsToTimestamp(secs) {
  if (isNaN(secs) || secs === Infinity || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function parseTimestampToSeconds(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[\[\]]/g, "").trim();
  if (cleaned.includes(":")) {
    const parts = cleaned.split(":");
    return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(cleaned) || 0;
}
