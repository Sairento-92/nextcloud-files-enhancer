(()=>{var m=class{constructor(){this.activeModal=null,this.currentFileIndex=-1,this.fileListItems=[],this.initKeybindings()}initKeybindings(){document.addEventListener("keydown",t=>{if(t.code==="Space"||t.key===" "){let e=t.target;if(e&&(e.tagName==="INPUT"||e.tagName==="TEXTAREA"||e.isContentEditable))return;if(this.activeModal){t.preventDefault(),this.close();return}let i=this.getSelectedFile();i&&(t.preventDefault(),this.open(i))}else t.key==="Escape"&&this.activeModal?(t.preventDefault(),this.close()):(t.key==="ArrowRight"||t.key==="ArrowDown")&&this.activeModal?(t.preventDefault(),this.navigate(1)):(t.key==="ArrowLeft"||t.key==="ArrowUp")&&this.activeModal&&(t.preventDefault(),this.navigate(-1))})}getSelectedFile(){if(this.fileListItems=this.getAllVisibleFiles(),this.fileListItems.length===0)return null;let t=document.querySelector("tr.selected, [data-entry-id].selected, tr[data-file]:focus-within");if(t){let i=t.getAttribute("data-file")||t.querySelector(".innernametext, .file-name")?.textContent?.trim(),o=this.fileListItems.findIndex(s=>s.name===i);if(o!==-1)return this.currentFileIndex=o,this.fileListItems[o]}let e=document.querySelector('input.selectCheckBox:checked, [data-entry-id] input[type="checkbox"]:checked');if(e){let i=e.closest("tr, [data-entry-id]"),o=i?.getAttribute("data-file")||i?.querySelector(".innernametext, .file-name")?.textContent?.trim(),s=this.fileListItems.findIndex(n=>n.name===o);if(s!==-1)return this.currentFileIndex=s,this.fileListItems[s]}return null}getAllVisibleFiles(){let t=[];return document.querySelectorAll("tr[data-file], [data-entry-id]").forEach(i=>{let o=i.getAttribute("data-file")||i.querySelector(".innernametext, .file-name")?.textContent?.trim(),s=i.getAttribute("data-mime")||"",n=i.getAttribute("data-type")||"",r=i.getAttribute("data-size")||"",a=i.getAttribute("data-id")||i.getAttribute("data-entry-id")||"";o&&n!=="dir"&&t.push({id:a,name:o,mime:s,size:r,row:i})}),t}navigate(t){if(this.fileListItems.length<=1)return;this.currentFileIndex=(this.currentFileIndex+t+this.fileListItems.length)%this.fileListItems.length;let e=this.fileListItems[this.currentFileIndex];e&&this.renderContent(e)}open(t){this.activeModal&&this.close();let e=document.createElement("div");e.id="files-enhancer-quicklook",e.className="fe-quicklook-overlay",e.innerHTML=`
            <div class="fe-quicklook-container">
                <div class="fe-quicklook-header">
                    <div class="fe-quicklook-title">
                        <span class="fe-quicklook-filename">${this.escapeHtml(t.name)}</span>
                        <span class="fe-quicklook-counter">(${this.currentFileIndex+1} / ${this.fileListItems.length})</span>
                    </div>
                    <div class="fe-quicklook-actions">
                        <button class="fe-ql-btn fe-ql-prev" title="Poprzedni plik (Strza\u0142ka w lewo)">\u25C0</button>
                        <button class="fe-ql-btn fe-ql-next" title="Nast\u0119pny plik (Strza\u0142ka w prawo)">\u25B6</button>
                        <button class="fe-ql-btn fe-ql-close" title="Zamknij (Esc)">\u2715</button>
                    </div>
                </div>
                <div class="fe-quicklook-body">
                    <div class="fe-quicklook-loader">Wczytywanie podgl\u0105du...</div>
                </div>
                <div class="fe-quicklook-footer">
                    <span>Nawiguj: <b>\u2190 / \u2192</b> | Zamknij: <b>Spacja / Esc</b></span>
                </div>
            </div>
        `,document.body.appendChild(e),this.activeModal=e,e.querySelector(".fe-ql-close").addEventListener("click",()=>this.close()),e.querySelector(".fe-ql-prev").addEventListener("click",()=>this.navigate(-1)),e.querySelector(".fe-ql-next").addEventListener("click",()=>this.navigate(1)),e.addEventListener("click",i=>{i.target===e&&this.close()}),this.renderContent(t)}renderContent(t){if(!this.activeModal)return;let e=this.activeModal.querySelector(".fe-quicklook-body"),i=this.activeModal.querySelector(".fe-quicklook-filename"),o=this.activeModal.querySelector(".fe-quicklook-counter");i.textContent=t.name,o.textContent=`(${this.currentFileIndex+1} / ${this.fileListItems.length})`,e.innerHTML='<div class="fe-quicklook-loader">Wczytywanie...</div>';let s=this.getFileDownloadUrl(t),n=t.name.split(".").pop().toLowerCase();if(["jpg","jpeg","png","gif","webp","svg","bmp","avif"].includes(n)){let r=document.createElement("img");r.className="fe-ql-img",r.src=s,r.onload=()=>{e.innerHTML="",e.appendChild(r)},r.onerror=()=>{e.innerHTML='<div class="fe-ql-error">Nie uda\u0142o si\u0119 za\u0142adowa\u0107 obrazu.</div>'}}else["mp4","webm","ogg","mov","mkv"].includes(n)?e.innerHTML=`
                <video class="fe-ql-video" controls autoplay>
                    <source src="${s}">
                    Twoja przegl\u0105darka nie obs\u0142uguje odtwarzania tego formatu wideo.
                </video>
            `:["mp3","wav","ogg","flac","m4a","aac"].includes(n)?e.innerHTML=`
                <div class="fe-ql-audio-container">
                    <div class="fe-ql-audio-icon">\u{1F3B5}</div>
                    <div style="font-weight: 600; margin-bottom: 12px;">${this.escapeHtml(t.name)}</div>
                    <audio class="fe-ql-audio" controls autoplay>
                        <source src="${s}">
                    </audio>
                </div>
            `:n==="pdf"?e.innerHTML=`
                <iframe class="fe-ql-iframe" src="${s}"></iframe>
            `:["txt","md","json","yaml","yml","xml","csv","sql","py","js","ts","php","html","css","sh","log","env","conf","ini"].includes(n)?fetch(s).then(r=>r.text()).then(r=>{let a=r.length>5e4?r.substring(0,5e4)+`

... [Podgl\u0105d przyci\u0119ty do pierwszych 50 KB]`:r;e.innerHTML=`
                        <pre class="fe-ql-code"><code>${this.escapeHtml(a)}</code></pre>
                    `}).catch(r=>{e.innerHTML='<div class="fe-ql-error">B\u0142\u0105d pobierania zawarto\u015Bci pliku: '+r.message+"</div>"}):e.innerHTML=`
                <div class="fe-ql-generic">
                    <div class="fe-ql-generic-icon">\u{1F4C4}</div>
                    <div class="fe-ql-generic-title">${this.escapeHtml(t.name)}</div>
                    <div class="fe-ql-generic-meta">Rozszerzenie: .${n.toUpperCase()}</div>
                    <a href="${s}" download="${this.escapeHtml(t.name)}" class="button primary fe-ql-download-btn">Pobierz plik</a>
                </div>
            `}getFileDownloadUrl(t){if(window.OCA&&window.OCA.Files&&window.OCA.Files.App&&window.OCA.Files.App.fileList)return window.OCA.Files.App.fileList.getDownloadUrl(t.name);let e=window.OCA&&window.OCA.Files&&window.OCA.Files.App&&window.OCA.Files.App.fileList?window.OCA.Files.App.fileList.getCurrentDirectory():"/",i=(e==="/"?"":e)+"/"+t.name;return OC.generateUrl("/remote.php/webdav"+encodeURI(i))}close(){this.activeModal&&(this.activeModal.remove(),this.activeModal=null)}escapeHtml(t){let e=document.createElement("div");return e.textContent=t||"",e.innerHTML}};var w=class{constructor(){this.init()}init(){this.registerFileActions(),this.registerBatchActions()}registerFileActions(){if(!window.OCA||!window.OCA.Files||!window.OCA.Files.fileActions)return;["application/zip","application/x-zip-compressed","application/x-tar","application/gzip","application/x-gzip"].forEach(e=>{window.OCA.Files.fileActions.registerAction({name:"FilesEnhancerExtract",displayName:"\u{1F4E6} Rozpakuj na serwerze",mime:e,permissions:OC.PERMISSION_READ|OC.PERMISSION_CREATE,iconClass:"icon-folder",actionHandler:(i,o)=>{this.extractArchive(i,o)}})}),window.OCA.Files.fileActions.registerAction({name:"FilesEnhancerCompressSingle",displayName:"\u{1F5DC}\uFE0F Spakuj do ZIP",mime:"all",permissions:OC.PERMISSION_READ|OC.PERMISSION_CREATE,iconClass:"icon-shared",actionHandler:(e,i)=>{this.compressItems([e],i)}})}registerBatchActions(){document.addEventListener("DOMContentLoaded",()=>{this.observeSelectionMenu()})}observeSelectionMenu(){new MutationObserver(()=>{let e=document.querySelector(".selection-actions, #filestable thead .selectedActions, .files-selection-summary");if(e&&!e.querySelector(".fe-batch-zip-btn")){let i=document.createElement("a");i.className="button btn fe-batch-zip-btn",i.href="#",i.innerHTML='<span class="icon-shared"></span> Spakuj do ZIP',i.style.marginLeft="8px",i.addEventListener("click",o=>{o.preventDefault();let s=this.getSelectedFileNames();s.length>0&&this.compressItems(s)}),e.appendChild(i)}}).observe(document.body,{childList:!0,subtree:!0})}getSelectedFileNames(){let t=[];return document.querySelectorAll("tr.selected, [data-entry-id].selected, input.selectCheckBox:checked").forEach(i=>{let o=i.closest("tr, [data-entry-id]"),s=o?.getAttribute("data-file")||o?.querySelector(".innernametext, .file-name")?.textContent?.trim();s&&!t.includes(s)&&t.push(s)}),t}extractArchive(t,e){let i=this.getCurrentDir(),o=(i==="/"?"":i)+"/"+t,s=OC.Notification.show("Rozpakowywanie archiwum na serwerze...");fetch(OC.generateUrl("/apps/files_enhancer/api/v1/archive/extract"),{method:"POST",headers:{"Content-Type":"application/json",requesttoken:OC.requestToken},body:JSON.stringify({path:o,destination:i})}).then(n=>n.json()).then(n=>{OC.Notification.hide(s),n.error?OC.Notification.showTemporary("B\u0142\u0105d rozpakowywania: "+n.error):(OC.Notification.showTemporary("\u2713 Pomy\u015Blnie rozpakowano "+n.extractedCount+" element\xF3w."),this.reloadFileList())}).catch(n=>{OC.Notification.hide(s),OC.Notification.showTemporary("B\u0142\u0105d po\u0142\u0105czenia: "+n.message)})}compressItems(t,e){let i=(t.length===1?t[0].replace(/\.[^/.]+$/,""):"Archiwum")+".zip",o=prompt("Podaj nazw\u0119 tworzonego archiwum ZIP:",i);if(!o)return;let s=this.getCurrentDir(),n=t.map(a=>(s==="/"?"":s)+"/"+a),r=OC.Notification.show("Tworzenie archiwum ZIP na serwerze...");fetch(OC.generateUrl("/apps/files_enhancer/api/v1/archive/compress"),{method:"POST",headers:{"Content-Type":"application/json",requesttoken:OC.requestToken},body:JSON.stringify({paths:n,zipName:o,targetFolder:s})}).then(a=>a.json()).then(a=>{OC.Notification.hide(r),a.error?OC.Notification.showTemporary("B\u0142\u0105d kompresji: "+a.error):(OC.Notification.showTemporary("\u2713 Pomy\u015Blnie utworzono archiwum "+a.zipName),this.reloadFileList())}).catch(a=>{OC.Notification.hide(r),OC.Notification.showTemporary("B\u0142\u0105d po\u0142\u0105czenia: "+a.message)})}getCurrentDir(){return window.OCA&&window.OCA.Files&&window.OCA.Files.App&&window.OCA.Files.App.fileList&&window.OCA.Files.App.fileList.getCurrentDirectory()||"/"}reloadFileList(){window.OCA&&window.OCA.Files&&window.OCA.Files.App&&window.OCA.Files.App.fileList&&window.OCA.Files.App.fileList.reload()}};var v=class{constructor(){this.tags={},this.colors=[{name:"Czerwony",hex:"#eb4d4b"},{name:"Pomara\u0144czowy",hex:"#f0932b"},{name:"\u017B\xF3\u0142ty",hex:"#f6e58d"},{name:"Zielony",hex:"#6ab04c"},{name:"Niebieski",hex:"#22a6b3"},{name:"Fioletowy",hex:"#be2edd"},{name:"Brak",hex:"none"}],this.init()}init(){this.loadTags(),this.registerAction(),this.observeDOM()}loadTags(){fetch(OC.generateUrl("/apps/files_enhancer/api/v1/tags"),{headers:{requesttoken:OC.requestToken}}).then(t=>t.json()).then(t=>{t.tags&&(this.tags=t.tags,this.applyTagsToDOM())}).catch(()=>{})}registerAction(){!window.OCA||!window.OCA.Files||!window.OCA.Files.fileActions||window.OCA.Files.fileActions.registerAction({name:"FilesEnhancerColorTag",displayName:"\u{1F3F7}\uFE0F Etykieta koloru",mime:"all",permissions:OC.PERMISSION_READ,iconClass:"icon-tag",actionHandler:(t,e)=>{let i=e?.$file?.attr("data-id")||e?.fileInfoModel?.get("id");i&&this.showTagPicker(i,t,e?.$file?.[0]||e?.target)}})}showTagPicker(t,e,i){document.querySelectorAll(".fe-tag-picker-popup").forEach(n=>n.remove());let o=document.createElement("div");if(o.className="fe-tag-picker-popup",o.innerHTML=`
            <div class="fe-tag-picker-title">Wybierz kolor etykiety dla: <b>${this.escapeHtml(e)}</b></div>
            <div class="fe-tag-picker-colors">
                ${this.colors.map(n=>`
                    <button class="fe-tag-btn" data-color="${n.hex}" title="${n.name}" style="background-color: ${n.hex==="none"?"transparent":n.hex};">
                        ${n.hex==="none"?"\u2715":""}
                    </button>
                `).join("")}
            </div>
        `,document.body.appendChild(o),i){let n=i.getBoundingClientRect();o.style.top=Math.min(window.innerHeight-150,n.bottom+window.scrollY+8)+"px",o.style.left=Math.min(window.innerWidth-260,n.left+window.scrollX)+"px"}else o.style.top="30%",o.style.left="50%",o.style.transform="translate(-50%, -50%)";o.querySelectorAll(".fe-tag-btn").forEach(n=>{n.addEventListener("click",()=>{let r=n.getAttribute("data-color");this.setTag(t,r),o.remove()})});let s=n=>{o.contains(n.target)||(o.remove(),document.removeEventListener("click",s))};setTimeout(()=>document.addEventListener("click",s),10)}setTag(t,e){e==="none"?delete this.tags[t]:this.tags[t]=e,this.applyTagsToDOM(),fetch(OC.generateUrl("/apps/files_enhancer/api/v1/tags"),{method:"POST",headers:{"Content-Type":"application/json",requesttoken:OC.requestToken},body:JSON.stringify({fileId:t,color:e})}).catch(()=>{})}applyTagsToDOM(){document.querySelectorAll("tr[data-id], [data-entry-id]").forEach(e=>{let i=e.getAttribute("data-id")||e.getAttribute("data-entry-id"),o=this.tags[i],s=e.querySelector(".fe-color-tag-dot");if(o&&o!=="none"){if(!s){s=document.createElement("span"),s.className="fe-color-tag-dot";let n=e.querySelector(".nametext, .innernametext, .file-name");n&&n.prepend(s)}s.style.backgroundColor=o,s.title="Etykieta koloru"}else s&&s.remove()})}observeDOM(){new MutationObserver(()=>{this.applyTagsToDOM()}).observe(document.body,{childList:!0,subtree:!0})}escapeHtml(t){let e=document.createElement("div");return e.textContent=t||"",e.innerHTML}};var y=class{constructor(){this.init()}init(){this.observeSelectionMenu()}observeSelectionMenu(){new MutationObserver(()=>{let e=document.querySelector(".selection-actions, #filestable thead .selectedActions, .files-selection-summary");if(e&&!e.querySelector(".fe-batch-rename-btn")){let i=document.createElement("a");i.className="button btn fe-batch-rename-btn",i.href="#",i.innerHTML='<span class="icon-rename"></span> Zmie\u0144 nazwy zbiorczo',i.style.marginLeft="8px",i.addEventListener("click",o=>{o.preventDefault();let s=this.getSelectedFileNames();s.length>0&&this.openDialog(s)}),e.appendChild(i)}}).observe(document.body,{childList:!0,subtree:!0})}getSelectedFileNames(){let t=[];return document.querySelectorAll("tr.selected, [data-entry-id].selected, input.selectCheckBox:checked").forEach(i=>{let o=i.closest("tr, [data-entry-id]"),s=o?.getAttribute("data-file")||o?.querySelector(".innernametext, .file-name")?.textContent?.trim();s&&!t.includes(s)&&t.push(s)}),t}openDialog(t){document.querySelectorAll(".fe-batch-rename-modal").forEach(o=>o.remove());let e=document.createElement("div");e.className="fe-batch-rename-modal",e.innerHTML=`
            <div class="fe-batch-rename-box">
                <div class="fe-modal-header">
                    <h3>\u{1F524} Hurtowa zmiana nazw (${t.length} element\xF3w)</h3>
                    <button class="fe-modal-close">\u2715</button>
                </div>
                <div class="fe-modal-body">
                    <div class="fe-form-row">
                        <label>Prefiks (dodaj na pocz\u0105tku):</label>
                        <input type="text" id="fe-ren-prefix" placeholder="np. Zdjecia_" />
                    </div>
                    <div class="fe-form-row">
                        <label>Sufiks (dodaj przed rozszerzeniem):</label>
                        <input type="text" id="fe-ren-suffix" placeholder="np. _kopia" />
                    </div>
                    <div class="fe-form-row" style="display: flex; gap: 10px;">
                        <div style="flex: 1;">
                            <label>Znajd\u017A tekst:</label>
                            <input type="text" id="fe-ren-find" placeholder="Tekst do zamiany" />
                        </div>
                        <div style="flex: 1;">
                            <label>Zast\u0105p przez:</label>
                            <input type="text" id="fe-ren-replace" placeholder="Nowy tekst" />
                        </div>
                    </div>
                    <div class="fe-form-row">
                        <label>Numeracja sekwencyjna:</label>
                        <select id="fe-ren-num">
                            <option value="none">Brak numeracji</option>
                            <option value="1">1, 2, 3...</option>
                            <option value="01">01, 02, 03...</option>
                            <option value="001">001, 002, 003...</option>
                        </select>
                    </div>

                    <div class="fe-preview-header">Podgl\u0105d zmian (pierwsze 5 plik\xF3w):</div>
                    <div class="fe-preview-list" id="fe-preview-container"></div>
                </div>
                <div class="fe-modal-footer">
                    <button class="button cancel fe-modal-close">Anuluj</button>
                    <button class="button primary" id="fe-ren-apply-btn">Zastosuj zmiany</button>
                </div>
            </div>
        `,document.body.appendChild(e);let i=()=>{let o=e.querySelector("#fe-ren-prefix").value,s=e.querySelector("#fe-ren-suffix").value,n=e.querySelector("#fe-ren-find").value,r=e.querySelector("#fe-ren-replace").value,a=e.querySelector("#fe-ren-num").value,c=e.querySelector("#fe-preview-container");c.innerHTML="",t.slice(0,5).forEach((l,h)=>{let A=this.calculateNewName(l,h+1,o,s,n,r,a),u=document.createElement("div");u.className="fe-preview-row",u.innerHTML=`<span class="fe-prev-orig">${this.escapeHtml(l)}</span> \u2794 <span class="fe-prev-new">${this.escapeHtml(A)}</span>`,c.appendChild(u)})};e.querySelectorAll("input, select").forEach(o=>o.addEventListener("input",i)),i(),e.querySelectorAll(".fe-modal-close").forEach(o=>o.addEventListener("click",()=>e.remove())),e.querySelector("#fe-ren-apply-btn").addEventListener("click",()=>{this.executeRename(e,t)})}calculateNewName(t,e,i,o,s,n,r){let a=t.lastIndexOf("."),c=a!==-1?t.substring(0,a):t,p=a!==-1?t.substring(a):"";s&&(c=c.replaceAll(s,n||""));let l="";return r==="1"?l=`_${e}`:r==="01"?l=`_${String(e).padStart(2,"0")}`:r==="001"&&(l=`_${String(e).padStart(3,"0")}`),`${i||""}${c}${l}${o||""}${p}`}async executeRename(t,e){let i=t.querySelector("#fe-ren-prefix").value,o=t.querySelector("#fe-ren-suffix").value,s=t.querySelector("#fe-ren-find").value,n=t.querySelector("#fe-ren-replace").value,r=t.querySelector("#fe-ren-num").value,a=this.getCurrentDir();t.querySelector(".fe-modal-body").innerHTML='<div class="fe-loading">Trwa zmienianie nazw plik\xF3w...</div>';let c=0;for(let p=0;p<e.length;p++){let l=e[p],h=this.calculateNewName(l,p+1,i,o,s,n,r);if(l===h)continue;let A=(a==="/"?"":a)+"/"+l,u=(a==="/"?"":a)+"/"+h;try{let f=await fetch(OC.generateUrl("/remote.php/webdav"+encodeURI(A)),{method:"MOVE",headers:{Destination:OC.generateUrl("/remote.php/webdav"+encodeURI(u)),requesttoken:OC.requestToken}});(f.ok||f.status===201||f.status===204)&&c++}catch(f){console.error("Rename failed for",l,f)}}t.remove(),OC.Notification.showTemporary(`\u2713 Pomy\u015Blnie zmieniono nazwy ${c} plik\xF3w.`),window.OCA&&window.OCA.Files&&window.OCA.Files.App&&window.OCA.Files.App.fileList&&window.OCA.Files.App.fileList.reload()}getCurrentDir(){return window.OCA&&window.OCA.Files&&window.OCA.Files.App&&window.OCA.Files.App.fileList&&window.OCA.Files.App.fileList.getCurrentDirectory()||"/"}escapeHtml(t){let e=document.createElement("div");return e.textContent=t||"",e.innerHTML}};var g=class{constructor(){this.init()}init(){!window.OCA||!window.OCA.Files||!window.OCA.Files.fileActions||window.OCA.Files.fileActions.registerAction({name:"FilesEnhancerChecksums",displayName:"\u{1F50D} Sumy kontrolne (Hashe)",mime:"all",permissions:OC.PERMISSION_READ,iconClass:"icon-info",actionHandler:(t,e)=>{this.calculateHashes(t,e)}})}calculateHashes(t,e){let i=this.getCurrentDir(),o=(i==="/"?"":i)+"/"+t,s=OC.Notification.show("Obliczanie sum kontrolnych (MD5, SHA-1, SHA-256)...");fetch(OC.generateUrl("/apps/files_enhancer/api/v1/hash"),{method:"POST",headers:{"Content-Type":"application/json",requesttoken:OC.requestToken},body:JSON.stringify({path:o})}).then(n=>n.json()).then(n=>{OC.Notification.hide(s),n.error?OC.Notification.showTemporary("B\u0142\u0105d obliczania hasha: "+n.error):this.showHashModal(t,n)}).catch(n=>{OC.Notification.hide(s),OC.Notification.showTemporary("B\u0142\u0105d po\u0142\u0105czenia: "+n.message)})}showHashModal(t,e){document.querySelectorAll(".fe-hash-modal").forEach(n=>n.remove());let i=document.createElement("div");i.className="fe-hash-modal",i.innerHTML=`
            <div class="fe-hash-box">
                <div class="fe-modal-header">
                    <h3>\u{1F50D} Sumy kontrolne pliku</h3>
                    <button class="fe-modal-close">\u2715</button>
                </div>
                <div class="fe-modal-body">
                    <div style="font-weight: 600; margin-bottom: 12px; font-size: 14px;">${this.escapeHtml(t)}</div>
                    
                    <div class="fe-hash-row">
                        <label>MD5:</label>
                        <div class="fe-hash-value-wrap">
                            <input type="text" readonly value="${e.md5}" id="fe-hash-md5" />
                            <button class="fe-copy-btn" data-target="fe-hash-md5">Kopiuj</button>
                        </div>
                    </div>

                    <div class="fe-hash-row">
                        <label>SHA-1:</label>
                        <div class="fe-hash-value-wrap">
                            <input type="text" readonly value="${e.sha1}" id="fe-hash-sha1" />
                            <button class="fe-copy-btn" data-target="fe-hash-sha1">Kopiuj</button>
                        </div>
                    </div>

                    <div class="fe-hash-row">
                        <label>SHA-256:</label>
                        <div class="fe-hash-value-wrap">
                            <input type="text" readonly value="${e.sha256}" id="fe-hash-sha256" />
                            <button class="fe-copy-btn" data-target="fe-hash-sha256">Kopiuj</button>
                        </div>
                    </div>

                    <div class="fe-hash-compare-section">
                        <label>Weryfikacja (wklej sum\u0119 od dostawcy):</label>
                        <input type="text" id="fe-hash-input-compare" placeholder="Wklej tutaj hash do por\xF3wnania..." />
                        <div id="fe-compare-result" style="margin-top: 6px; font-weight: 600; font-size: 13px;"></div>
                    </div>
                </div>
                <div class="fe-modal-footer">
                    <button class="button primary fe-modal-close">Zamknij</button>
                </div>
            </div>
        `,document.body.appendChild(i),i.querySelectorAll(".fe-copy-btn").forEach(n=>{n.addEventListener("click",()=>{let r=n.getAttribute("data-target"),a=i.querySelector("#"+r).value;navigator.clipboard.writeText(a),n.textContent="Skopiowano!",setTimeout(()=>n.textContent="Kopiuj",2e3)})});let o=i.querySelector("#fe-hash-input-compare"),s=i.querySelector("#fe-compare-result");o.addEventListener("input",()=>{let n=o.value.trim().toLowerCase();if(!n){s.textContent="";return}n===e.md5.toLowerCase()?s.innerHTML='<span style="color: var(--color-success);">\u2713 Zgodny z MD5!</span>':n===e.sha1.toLowerCase()?s.innerHTML='<span style="color: var(--color-success);">\u2713 Zgodny z SHA-1!</span>':n===e.sha256.toLowerCase()?s.innerHTML='<span style="color: var(--color-success);">\u2713 Zgodny z SHA-256!</span>':s.innerHTML='<span style="color: var(--color-error);">\u2715 Suma kontrolna NIE pasuje!</span>'}),i.querySelectorAll(".fe-modal-close").forEach(n=>n.addEventListener("click",()=>i.remove()))}getCurrentDir(){return window.OCA&&window.OCA.Files&&window.OCA.Files.App&&window.OCA.Files.App.fileList&&window.OCA.Files.App.fileList.getCurrentDirectory()||"/"}escapeHtml(t){let e=document.createElement("div");return e.textContent=t||"",e.innerHTML}};var C=class{constructor(){this.init()}init(){!window.OCA||!window.OCA.Files||!window.OCA.Files.fileActions||window.OCA.Files.fileActions.registerAction({name:"FilesEnhancerFolderSize",displayName:"\u{1F4D0} Oblicz rozmiar folderu",mime:"dir",permissions:OC.PERMISSION_READ,iconClass:"icon-info",actionHandler:(t,e)=>{this.calculateSize(t,e)}})}calculateSize(t,e){let i=this.getCurrentDir(),o=(i==="/"?"":i)+"/"+t,s=OC.Notification.show("Obliczanie rozmiaru folderu "+t+"...");fetch(OC.generateUrl("/apps/files_enhancer/api/v1/folder/size"),{method:"POST",headers:{"Content-Type":"application/json",requesttoken:OC.requestToken},body:JSON.stringify({path:o})}).then(n=>n.json()).then(n=>{if(OC.Notification.hide(s),n.error)OC.Notification.showTemporary("B\u0142\u0105d: "+n.error);else{let r=this.formatBytes(n.size);OC.dialogs.info(`Folder: <b>${this.escapeHtml(n.name)}</b><br><br>Rozmiar: <b>${r}</b> (${n.size.toLocaleString()} bajt\xF3w)<br>Liczba plik\xF3w: <b>${n.files.toLocaleString()}</b><br>Podfolder\xF3w: <b>${n.folders.toLocaleString()}</b>`,"Rozmiar folderu",null,!0)}}).catch(n=>{OC.Notification.hide(s),OC.Notification.showTemporary("B\u0142\u0105d po\u0142\u0105czenia: "+n.message)})}formatBytes(t){if(t===0)return"0 B";let e=1024,i=["B","KB","MB","GB","TB"],o=Math.floor(Math.log(t)/Math.log(e));return parseFloat((t/Math.pow(e,o)).toFixed(2))+" "+i[o]}getCurrentDir(){return window.OCA&&window.OCA.Files&&window.OCA.Files.App&&window.OCA.Files.App.fileList&&window.OCA.Files.App.fileList.getCurrentDirectory()||"/"}escapeHtml(t){let e=document.createElement("div");return e.textContent=t||"",e.innerHTML}};var b=class{constructor(){this.init()}init(){!window.OCA||!window.OCA.Files||!window.OCA.Files.fileActions||(window.OCA.Files.fileActions.registerAction({name:"FilesEnhancerCopyPath",displayName:"\u{1F4CB} Kopiuj \u015Bcie\u017Ck\u0119 wewn\u0119trzn\u0105",mime:"all",permissions:OC.PERMISSION_READ,iconClass:"icon-clippy",actionHandler:t=>{let e=this.getCurrentDir(),i=(e==="/"?"":e)+"/"+t;navigator.clipboard.writeText(i),OC.Notification.showTemporary("\u2713 Skopiowano \u015Bcie\u017Ck\u0119: "+i)}}),window.OCA.Files.fileActions.registerAction({name:"FilesEnhancerCopyWebDav",displayName:"\u{1F310} Kopiuj link WebDAV",mime:"all",permissions:OC.PERMISSION_READ,iconClass:"icon-public",actionHandler:t=>{let e=this.getCurrentDir(),i=(e==="/"?"":e)+"/"+t,o=window.location.origin+OC.generateUrl("/remote.php/webdav"+encodeURI(i));navigator.clipboard.writeText(o),OC.Notification.showTemporary("\u2713 Skopiowano bezpo\u015Bredni link WebDAV")}}))}getCurrentDir(){return window.OCA&&window.OCA.Files&&window.OCA.Files.App&&window.OCA.Files.App.fileList&&window.OCA.Files.App.fileList.getCurrentDirectory()||"/"}};var O=class{constructor(){this.initialized=!1,this.init()}init(){console.info("[Files Enhancer] Inicjalizacja pakietu rozszerze\u0144 dla Nextcloud Files (by Sairento)...");let t=()=>{this.initialized||(new m,new w,new v,new y,new g,new C,new b,this.injectHeaderPill(),this.initialized=!0,console.info("[Files Enhancer] Wszystkie modu\u0142y za\u0142adowane pomy\u015Blnie."))};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",t):t(),window.addEventListener("popstate",()=>{setTimeout(t,300)})}injectHeaderPill(){let t=document.querySelector("#header .header-left, .header-menu, #header");if(t&&!document.querySelector(".fe-header-badge")){let e=document.createElement("div");e.className="fe-header-badge",e.title="Files Enhancer aktywny (QuickLook, ZIP/TAR, Color Tags, Hashe, Batch Rename)",e.innerHTML="<span>\u26A1 Files+</span>",t.appendChild(e)}}};new O;})();
