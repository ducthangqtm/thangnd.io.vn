document.addEventListener("DOMContentLoaded", () => {
  console.log("Hệ thống thangnd.io.vn - Node: THANGND_CORE đã sẵn sàng!");

  // --- 1. GIẢ LẬP UPTIME (Dân Network) ---
  const uptimeElement = document.getElementById("uptime");
  if (uptimeElement) {
    let startTime = Date.now() - 1524000; // Giả lập uptime từ trước

    setInterval(() => {
      let diff = Math.floor((Date.now() - startTime) / 1000);
      let hours = Math.floor(diff / 3600);
      let mins = Math.floor((diff % 3600) / 60);
      let secs = diff % 60;

      // Format 00:00:00 cho ngầu
      const pad = (num) => num.toString().padStart(2, "0");
      uptimeElement.innerText = `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
    }, 1000);
  }

  // --- 2. XỬ LÝ NÚT LIKE / CONNECT ---
  const btnLike = document.getElementById("btn-like");
  if (btnLike) {
    btnLike.addEventListener("click", () => {
      alert("👍 Cảm ơn Sếp! Tín hiệu đã được ghi nhận vào hệ thống.");
    });
  }
});

// --- 3. LOGIC CHAT VỚI TIỂU TUYẾT (OPENCLAW) ---
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const box = document.getElementById("chat-messages");

  if (!input || !box) return; // Bảo vệ nếu chưa login (không có khung chat)

  const msg = input.value.trim();
  if (!msg) return;

  // 1. Hiển thị tin nhắn của Sếp lên màn hình ngay lập tức
  box.innerHTML += `
    <div class="text-right">
      <span class="text-blue-400 font-bold">> Sếp:</span> 
      <span class="text-gray-300">${msg}</span>
    </div>
  `;

  // Xóa ô input và cuộn xuống cuối
  input.value = "";
  box.scrollTop = box.scrollHeight;

  // 2. Hiện trạng thái đang xử lý (Loading)
  const loadingId = "msg-" + Date.now();
  box.innerHTML += `
    <div id="${loadingId}" class="text-pink-400 opacity-50 animate-pulse">
      > TT: Đang truy vấn OpenClaw...
    </div>
  `;
  box.scrollTop = box.scrollHeight;

  try {
    // 3. Gửi lệnh vào Flask Backend
    const response = await fetch("/chat_tt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ msg: msg }),
    });

    const data = await response.json();

    // Xóa dòng loading
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    // 4. Hiển thị câu trả lời của Tiểu Tuyết
    if (data.reply) {
      box.innerHTML += `
        <div class="text-left">
          <span class="text-pink-500 font-bold">> TT:</span> 
          <span class="text-pink-100">${data.reply}</span>
        </div>
      `;
    } else if (data.error) {
      box.innerHTML += `<div class="text-red-500 text-[9px]">!! [ERROR]: ${data.error}</div>`;
    }
  } catch (e) {
    // Xử lý khi rớt mạng hoặc server OpenClaw sập
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();
    box.innerHTML += `<div class="text-red-500 text-[9px]">!! [CRITICAL_FAILURE]: Mất kết nối tới Gateway 18789</div>`;
  }

  // Luôn luôn cuộn xuống cuối sau khi nhận tin
  box.scrollTop = box.scrollHeight;
}
