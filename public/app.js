const tripId = new URLSearchParams(location.search).get("id") || "";
const $ = (id) => document.getElementById(id);

const codeInput = $("code");
const nameInput = $("name");
const fileInput = $("fileInput");
const addBtn = $("addBtn");
const statusEl = $("status");
const progress = $("progress");
const bar = progress.firstElementChild;

// Remember code and name on this phone so people only type them once
try {
  codeInput.value = localStorage.getItem("utp-code") || "";
  nameInput.value = localStorage.getItem("utp-name") || "";
} catch {}

function setStatus(msg, kind = "") {
  statusEl.textContent = msg;
  statusEl.className = "status " + kind;
}

// Load trip details
fetch("trips.json", { cache: "no-store" })
  .then((r) => r.json())
  .then((trips) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) {
      $("tripName").textContent = "Trip not found";
      addBtn.disabled = true;
      return;
    }
    $("tripName").textContent = trip.name;
    $("tripDates").textContent = trip.dates || "";
    document.title = trip.name + " – Photos";
    loadGallery();
  });

async function loadGallery() {
  const res = await fetch("/api/photos?trip=" + encodeURIComponent(tripId));
  const data = await res.json().catch(() => ({ photos: [] }));
  const gallery = $("gallery");
  gallery.innerHTML = "";
  (data.photos || []).forEach((p) => {
    const fig = document.createElement("figure");
    const img = document.createElement("img");
    img.src = p.url;
    img.loading = "lazy";
    img.alt = p.name ? "Photo from " + p.name : "Trip photo";
    img.onclick = () => openViewer(p.url);
    fig.append(img);
    if (p.name) {
      const cap = document.createElement("figcaption");
      cap.textContent = "📷 " + p.name;
      fig.append(cap);
    }
    gallery.append(fig);
  });
  $("empty").hidden = (data.photos || []).length > 0;
}

addBtn.onclick = () => {
  if (!codeInput.value.trim()) {
    setStatus("Please type the trip code first.", "error");
    codeInput.focus();
    return;
  }
  fileInput.click();
};

fileInput.onchange = async () => {
  const files = [...fileInput.files];
  fileInput.value = "";
  if (!files.length) return;

  const code = codeInput.value.trim();
  const name = nameInput.value.trim();
  try {
    localStorage.setItem("utp-code", code);
    localStorage.setItem("utp-name", name);
  } catch {}

  addBtn.disabled = true;
  progress.style.display = "block";
  let done = 0, failed = 0;

  for (const file of files) {
    setStatus(`Uploading ${done + failed + 1} of ${files.length}…`);
    try {
      const blob = await shrink(file);
      const form = new FormData();
      form.append("code", code);
      form.append("trip", tripId);
      form.append("name", name);
      form.append("photo", blob, "photo.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          setStatus(out.error || "Wrong trip code.", "error");
          break;
        }
        throw new Error(out.error || "Upload failed");
      }
      done++;
    } catch (e) {
      console.error(e);
      failed++;
    }
    bar.style.width = Math.round(((done + failed) / files.length) * 100) + "%";
  }

  addBtn.disabled = false;
  setTimeout(() => { progress.style.display = "none"; bar.style.width = "0"; }, 800);
  if (done) {
    setStatus(`✅ ${done} photo${done > 1 ? "s" : ""} added. Thank you!` + (failed ? ` (${failed} didn't upload)` : ""), "ok");
    loadGallery();
  } else if (failed) {
    setStatus("Sorry, the photos didn't upload. Please try again.", "error");
  }
};

// Make big phone photos smaller (max 2000px, JPEG) so uploads are fast
async function shrink(file, max = 2000) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (blob) return blob;
  } catch (e) {
    console.warn("Could not resize, sending original", e);
  }
  return file;
}

// Full-size viewer
function openViewer(url) {
  $("viewerImg").src = url;
  $("dl").href = url;
  $("viewer").classList.add("open");
}
$("closeViewer").onclick = () => $("viewer").classList.remove("open");
$("viewer").onclick = (e) => { if (e.target.id === "viewer") $("viewer").classList.remove("open"); };
