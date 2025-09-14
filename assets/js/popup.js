import {groupCookiesByDomain} from './utils.js';
import psl from './psl.mjs';

const $ = sel => document.querySelector(sel);
const listEl = $('#cookie-items');
const headerEl = $('#site-header');
const deleteAllBtn = $('#delete-all');
const footerEl = $('#footer');

async function init() {
  const tab = await getActiveTab();
  if (!tab || !tab.url) return showMessage('No active tab');
  const url = new URL(tab.url);
  const domain = psl.parse(url.hostname).domain;
  headerEl.textContent = sliceText(tab.title);

  document.querySelectorAll("[data-i18n-text]").forEach(elm => {
    const key = elm.getAttribute("data-i18n-text");
    elm.textContent = chrome.i18n.getMessage(key);
  });

  const cookies = await chrome.cookies.getAll({domain: domain});

  renderCookies(cookies, domain);
}

function showMessage(m){ 
  listEl.innerHTML = `<div style=\"padding:8px;color:#666\">${m}</div>`;
  footerEl.style.display = 'none';
}

function renderCookies(cookies, hostname){
  if (!cookies.length){
    return showMessage('No cookies found');
  }

  const grouped = groupCookiesByDomain(cookies);

  listEl.innerHTML = '';

  for (const [index, domain] of Object.keys(grouped).sort().entries()){
    const normalizedDomain = domain.startsWith('.') ? domain.slice(1) : domain;

    if (!(hostname === normalizedDomain || normalizedDomain.endsWith(hostname))) continue;

    const block = document.createElement('details'); block.className = 'domain-block';
    const title = document.createElement('summary'); title.textContent = domain; block.appendChild(title);

    for (const c of grouped[domain]){
      const row = document.createElement('div'); row.className='cookie-row';
      const name = document.createElement('div'); name.className='cookie-name'; name.textContent = c.name;
      const key = document.createElement('div'); key.className='cookie-key'; key.textContent = sliceText(c.value);
      const del = document.createElement('button'); del.className='cookie-trash'; del.innerText='🗑️';

      del.addEventListener('click', async ()=>{
        await deleteCookie(c); row.remove();
      });

      row.appendChild(name);
      row.appendChild(key);
      row.appendChild(del);
      block.appendChild(row);
    }

    listEl.appendChild(block);
  }
}

async function deleteCookie(c){
  const protocol = (c.secure)? 'https' : 'http';
  const host = c.domain && c.domain.startsWith('.') ? c.domain.slice(1) : c.domain;
  const url = `${protocol}://${host}${c.path}`;

  try {
    await chrome.cookies.remove({url, name: c.name});
  } catch (e) { console.error('delete failed', e); }
}

async function deleteAll(){
  const items = Array.from(document.querySelectorAll('.cookie-trash'));

  for (const item of items){ item.click(); }
}

function getActiveTab(){
  return new Promise(resolve => {
    chrome.tabs.query({active:true,currentWindow:true}, tabs => resolve(tabs[0]));
  });
}

function sliceText(text, count = 64) {
  let result = text;

  if (text.length > count) {
    const chars = Array.from(text);
    result = chars.slice(0, count).join('') + ' [...]';
  }

  return result;
}

deleteAllBtn.addEventListener('click', deleteAll);

init();
