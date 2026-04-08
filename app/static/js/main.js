function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (!message) return;

  // Hiển thị tin nhắn của Sếp lên màn hình
  appendMessage("user", message);
  input.value = "";

  // Gọi API về Flask (Cổng 5000)
  fetch("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: message }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Nếu Flask trả về nội dung, hiển thị tin nhắn của AI
      if (data.response) {
        appendMessage("ai", data.response);
      } else {
        // Đây chính là nơi nó hiện cái dòng Gateway giả kia nếu có lỗi
        appendMessage("error", "!! [SYSTEM_ERROR]: AI không phản hồi.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      appendMessage(
        "error",
        "!! [NETWORK_FAILURE]: Không thể kết nối tới Flask Server.",
      );
    });
}

function appendMessage(role, text) {
  const chatBox = document.getElementById("chat-messages");
  const div = document.createElement("div");

  // Sếp tùy biến CSS cho từng loại tin nhắn ở đây
  if (role === "user") {
    div.className = "text-right text-blue-400 font-bold text-sm";
    div.innerHTML = `> Sếp: ${text}`;
  } else if (role === "ai") {
    div.className =
      "flex gap-4 items-start animate-fade-in text-slate-300 text-sm";
    div.innerHTML = `<div class="w-8 h-8 rounded-lg bg-pink-500/20 flex-shrink-0 flex items-center justify-center text-pink-500">✨</div>
                         <div class="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">${text}</div>`;
  } else {
    div.className = "text-[10px] text-red-500 font-mono mt-2";
    div.innerHTML = `!! [CRITICAL_FAILURE]: ${text}`;
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}
