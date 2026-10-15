const STORAGE_KEYS = { donors: "lifedrop_donors_v1", requests: "lifedrop_requests_v1" };
const $ = (id) => document.getElementById(id);
let donors = readStore(STORAGE_KEYS.donors);
let requests = readStore(STORAGE_KEYS.requests);
let toastTimer;

function readStore(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function saveStore() {
  localStorage.setItem(STORAGE_KEYS.donors, JSON.stringify(donors));
  localStorage.setItem(STORAGE_KEYS.requests, JSON.stringify(requests));
}
function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function normalizePhone(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  // For Indian 10-digit mobile numbers, add country code 91.
  if (digits.length === 10) digits = "91" + digits;
  return digits;
}
function whatsappUrl(phone, message) {
  const number = normalizePhone(phone);
  if (number.length < 10 || number.length > 15) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
function openWhatsApp(phone, message) {
  const url = whatsappUrl(phone, message);
  if (!url) {
    showToast("Please check the phone number. Include country code if needed.");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
function formatDate(value) {
  if (!value) return "Not specified";
  const date = new Date(value + "T00:00:00");
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

$("donorForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const donor = {
    id: makeId(),
    name: $("donorName").value.trim(),
    phone: $("donorPhone").value.trim(),
    group: $("donorGroup").value,
    location: $("donorLocation").value.trim(),
    createdAt: new Date().toISOString()
  };
  if (!donor.name || !donor.phone || !donor.group || !donor.location) {
    $("donorMessage").textContent = "Please fill in all required fields.";
    return;
  }
  donors.unshift(donor);
  saveStore();
  $("donorForm").reset();
  $("donorMessage").textContent = "Thank you! Your donor registration has been saved on this device.";
  renderAll();
  showToast("Donor registered successfully.");
});

$("requestForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const request = {
    id: makeId(),
    name: $("requestName").value.trim(),
    phone: $("requestPhone").value.trim(),
    group: $("requestGroup").value,
    units: Number($("requestUnits").value),
    hospital: $("requestHospital").value.trim(),
    location: $("requestLocation").value.trim(),
    date: $("requestDate").value,
    details: $("requestDetails").value.trim(),
    status: "Pending",
    createdAt: new Date().toISOString()
  };
  if (!request.name || !request.phone || !request.group || !request.units || !request.hospital || !request.location || !request.date) {
    $("requestMessage").textContent = "Please complete all required fields.";
    return;
  }
  requests.unshift(request);
  saveStore();
  $("requestForm").reset();
  $("requestUnits").value = 1;
  $("requestMessage").textContent = "Your request has been saved on this device. Please contact a hospital or blood bank directly for urgent needs.";
  renderAll();
  showToast("Blood request submitted.");
});

$("searchGroup").addEventListener("change", renderDonorResults);
$("searchLocation").addEventListener("input", renderDonorResults);

function renderDonorResults() {
  const group = $("searchGroup").value;
  const location = $("searchLocation").value.trim().toLowerCase();
  const filtered = donors.filter(donor =>
    (!group || donor.group === group) &&
    (!location || donor.location.toLowerCase().includes(location))
  );
  const container = $("donorResults");
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state">No registered donors match this search yet.</div>';
    return;
  }
  container.innerHTML = filtered.map(donor => `
    <article class="donor-card">
      <div class="donor-card-top">
        <div class="blood-badge">${safeText(donor.group)}</div>
        <div><h3>${safeText(donor.name)}</h3><p>📍 ${safeText(donor.location)}</p></div>
      </div>
      <button class="btn btn-primary" type="button" data-donor-whatsapp="${safeText(donor.id)}">Contact on WhatsApp</button>
    </article>
  `).join("");
  container.querySelectorAll("[data-donor-whatsapp]").forEach(button => {
    button.addEventListener("click", () => {
      const donor = donors.find(item => item.id === button.dataset.donorWhatsapp);
      if (donor) openWhatsApp(donor.phone, `Hello ${donor.name}, I found your donor registration on LifeDrop. Are you currently available to discuss a ${donor.group} blood donation request near ${donor.location}?`);
    });
  });
}

function renderAdminTables() {
  $("donorCount").textContent = donors.length;
  $("requestCount").textContent = requests.length;
  const donorTable = $("donorTable");
  donorTable.innerHTML = donors.length ? donors.map(donor => `
    <tr>
      <td>${safeText(donor.name)}</td><td><strong>${safeText(donor.group)}</strong></td>
      <td>${safeText(donor.location)}</td><td>${safeText(donor.phone)}</td>
      <td><div class="action-group">
        <button class="mini-btn whatsapp" data-donor-contact="${safeText(donor.id)}">WhatsApp</button>
        <button class="mini-btn delete" data-donor-delete="${safeText(donor.id)}">Delete</button>
      </div></td>
    </tr>`).join("") : '<tr><td colspan="5">No donor registrations yet.</td></tr>';

  const requestTable = $("requestTable");
  requestTable.innerHTML = requests.length ? requests.map(request => `
    <tr>
      <td>${safeText(request.name)}<br><small>${safeText(request.phone)}</small></td>
      <td><strong>${safeText(request.group)}</strong> · ${safeText(request.units)} unit(s)</td>
      <td>${safeText(request.hospital)}<br><small>${safeText(request.location)}</small></td>
      <td>${safeText(formatDate(request.date))}</td>
      <td><select class="status-select" data-request-status="${safeText(request.id)}">
        ${["Pending", "Contacted", "Fulfilled", "Cancelled"].map(status => `<option ${request.status === status ? "selected" : ""}>${status}</option>`).join("")}
      </select></td>
      <td><div class="action-group">
        <button class="mini-btn whatsapp" data-request-contact="${safeText(request.id)}">WhatsApp</button>
        <button class="mini-btn delete" data-request-delete="${safeText(request.id)}">Delete</button>
      </div></td>
    </tr>`).join("") : '<tr><td colspan="6">No blood requests yet.</td></tr>';

  donorTable.querySelectorAll("[data-donor-contact]").forEach(button => button.addEventListener("click", () => {
    const donor = donors.find(item => item.id === button.dataset.donorContact);
    if (donor) openWhatsApp(donor.phone, `Hello ${donor.name}, I am contacting you through the LifeDrop blood donation directory. Are you available to discuss a ${donor.group} blood donation request near ${donor.location}?`);
  }));
  donorTable.querySelectorAll("[data-donor-delete]").forEach(button => button.addEventListener("click", () => {
    if (!confirm("Delete this donor registration from this browser?")) return;
    donors = donors.filter(item => item.id !== button.dataset.donorDelete);
    saveStore(); renderAll(); showToast("Donor registration deleted.");
  }));
  requestTable.querySelectorAll("[data-request-contact]").forEach(button => button.addEventListener("click", () => {
    const request = requests.find(item => item.id === button.dataset.requestContact);
    if (request) openWhatsApp(request.phone, `Hello ${request.name}, I am contacting you about your LifeDrop blood request for ${request.group} (${request.units} unit(s)) at ${request.hospital}, ${request.location}. Is this request still active?`);
  }));
  requestTable.querySelectorAll("[data-request-delete]").forEach(button => button.addEventListener("click", () => {
    if (!confirm("Delete this blood request from this browser?")) return;
    requests = requests.filter(item => item.id !== button.dataset.requestDelete);
    saveStore(); renderAll(); showToast("Blood request deleted.");
  }));
  requestTable.querySelectorAll("[data-request-status]").forEach(select => select.addEventListener("change", () => {
    const request = requests.find(item => item.id === select.dataset.requestStatus);
    if (request) { request.status = select.value; saveStore(); showToast("Request status updated."); }
  }));
}

function renderAll() {
  renderDonorResults();
  renderAdminTables();
}
document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.toggle("active", tab === button));
    $("donorsTab").classList.toggle("hidden", button.dataset.tab !== "donorsTab");
    $("requestsTab").classList.toggle("hidden", button.dataset.tab !== "requestsTab");
  });
});

$("exportBtn").addEventListener("click", () => {
  const rows = [
    ["Type", "Name", "Phone", "Blood Group", "Location", "Hospital", "Units", "Required Date", "Status", "Details"],
    ...donors.map(d => ["Donor", d.name, d.phone, d.group, d.location, "", "", "", "", ""]),
    ...requests.map(r => ["Request", r.name, r.phone, r.group, r.location, r.hospital, r.units, r.date, r.status, r.details])
  ];
  const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lifedrop-data.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("CSV file exported.");
});

$("menuToggle").addEventListener("click", () => $("mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(link => link.addEventListener("click", () => $("mainNav").classList.remove("open")));
$("requestDate").min = new Date().toISOString().slice(0, 10);
renderAll();
