let toastHost: HTMLElement | null = null;

/** A small toast in the corner of the page, isolated from YouTube's CSS by a shadow root. */
export function showToast(text: string, action: { label: string; onClick: () => void }, dark: boolean) {
  toastHost?.remove();
  const host = document.createElement('div');
  toastHost = host;
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
    <style>
      .toast { position: fixed; left: 24px; bottom: 24px; z-index: 2147483647;
        display: flex; align-items: center; gap: 16px; padding: 12px 16px;
        border-radius: 10px; font: 500 14px/1.2 system-ui, sans-serif;
        background: #fff; color: #18181b; border: 1px solid #e4e4e7;
        box-shadow: 0 8px 24px rgb(0 0 0 / .15); }
      .toast.dark { background: #18181b; color: #fafafa; border-color: #27272a;
        box-shadow: 0 8px 24px rgb(0 0 0 / .35); }
      .dot { width: 8px; height: 8px; border-radius: 50%; background: #dc2626; }
      button { all: unset; cursor: pointer; color: #dc2626; font-weight: 600; }
      .dark button { color: #fca5a5; }
      button:hover { text-decoration: underline; }
    </style>
    <div class="toast${dark ? ' dark' : ''}" role="status"><span class="dot"></span><span></span><button></button></div>`;
  root.querySelector('span:not(.dot)')!.textContent = text;
  const button = root.querySelector('button')!;
  button.textContent = action.label;
  button.addEventListener('click', () => {
    action.onClick();
    host.remove();
  });
  document.body.append(host);
  setTimeout(() => host.remove(), 6000);
}
