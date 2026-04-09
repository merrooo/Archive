import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==================== Firebase Configuration ====================
const firebaseConfig = {
    apiKey: "AIzaSyDquJ7Juh5Gs6vyF20jwtnSWFdruPMxKak",
    authDomain: "smart-4108d.firebaseapp.com",
    databaseURL: "https://smart-4108d-default-rtdb.firebaseio.com",
    projectId: "smart-4108d",
    storageBucket: "smart-4108d.firebasestorage.app",
    messagingSenderId: "209084102507",
    appId: "1:209084102507:web:2e6c529a096764da99fe2e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==================== Constants & State ====================
const FULL_COLUMNS = [
    "كود المشترك", "قطاع", "فرع", "منطقة", "يومية", "مرجع", "فرعى", "وحده", "اسم المشترك",
    "الرقم القومي", "العنوان", "رقم التليفون", "نوع الرسائل", "نوع الرسائل.1",
    "كود السداد", "حالة الاشتراك", "الجهد", "القدرة", "معامل الضرب", "رقم العداد",
    "تاريخ التعاقد", "نوع التعاقد العداد", "النشاط", "وصف المكانالغرض", "Category",
    "Address (General Region)", "Address (Region)", "Address (District)", "Phase Wire",
    "Meter type name", "Manufactured company name", "Manufactured year", "VT ratio",
    "Pre-payment function", "Name of connected KIOSK", "Code of Feeder", "Name of connected Feeder",
    "SIM_S_Num", "BadgeNumber", "Manufacturer", "Model", "TYPE", "rise_date_session",
    "SerialNum", "EEHCUnifiedCode", "FacilityDescription", "DistributionFacility", "InstallationDate",
    "LossesArea", "DeviceFunction", "KioskCode", "DivisionCode", "LatitudeY", "LongitudeX"
];

let cachedAllData = [];
let currentResults = [];
let currentPage = 1;
const ROWS_PER_PAGE = 50;

// ==================== Helper Functions ====================

function sanitizeKey(key) {
    if (!key) return "";
    return String(key).trim().replace(/[\.\#\$\/\[\]]/g, '_');
}

function cleanVal(val) {
    if (val === undefined || val === null) return "";
    return String(val).trim();
}

function showLoading(text) {
    Swal.fire({ title: text, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== Data Loading ====================

async function loadData() {
    showLoading('جاري تحديث قاعدة البيانات...');
    try {
        const snap = await get(ref(db, 'Smart_Qabda'));
        if (snap.exists()) {
            const dataObj = snap.val();
            cachedAllData = Object.keys(dataObj).map(key => ({
                ...dataObj[key],
                firebase_id: key
            }));
            currentResults = [...cachedAllData];
        } else {
            cachedAllData = [];
            currentResults = [];
        }
        renderTable();
        Swal.close();
    } catch (e) {
        Swal.fire('خطأ', 'فشل تحميل البيانات', 'error');
    }
}

function renderTable() {
    const header = document.getElementById('tableHeaderRow');
    const tbody = document.getElementById('tableBody');
    if (!header || !tbody) return;

    header.innerHTML = `<th style="position:sticky; right:0; z-index:11; background:#334155;">الإجراءات</th>` +
        FULL_COLUMNS.map(c => `<th>${c}</th>`).join('');

    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const pageData = currentResults.slice(start, start + ROWS_PER_PAGE);

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="100%" style="text-align:center; padding:50px;">❌ لا توجد بيانات مطابقة للفلاتر</td><tr>`;
    } else {
        tbody.innerHTML = pageData.map(item => {
            const fId = item.firebase_id;
            return `<tr>
                <td style="position:sticky; right:0; z-index:5; background: #1e293b; border-left: 2px solid #334155;">
                    <div class="row-actions">
                        <button class="row-btn-save" onclick="window.saveRow('${fId}', this)">💾</button>
                        <button class="row-btn-del" onclick="window.deleteRow('${fId}')">🗑️</button>
                    </div>
                </td>
                ${FULL_COLUMNS.map(col => {
                    const key = sanitizeKey(col);
                    let val = item[key] !== undefined ? item[key] : (item[col] || "");
                    const isEditable = !col.includes("عداد") && !col.includes("Badge") && !col.includes("TYPE") && !col.includes("type") && !col.includes("Serial");
                    return `<td contenteditable="${isEditable}" data-key="${key}">${escapeHtml(val)}</td>`;
                }).join('')}
            </table>`;
        }).join('');
    }
    updateUI();
}

function updateUI() {
    document.getElementById('totalCount').innerText = currentResults.length;
    document.getElementById('visibleCount').innerText = Math.min(currentPage * ROWS_PER_PAGE, currentResults.length);
    document.getElementById('pageInfo').innerText = `صفحة ${currentPage}`;
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (nextPageBtn) nextPageBtn.disabled = (currentPage * ROWS_PER_PAGE >= currentResults.length);
}

// ==================== Core Operations ====================

window.saveRow = async (id, btn) => {
    const tr = btn.closest('tr');
    const updates = {};
    tr.querySelectorAll('td[contenteditable="true"]').forEach(td => {
        updates[td.dataset.key] = td.innerText.trim();
    });
    try {
        await update(ref(db, `Smart_Qabda/${id}`), updates);
        Swal.fire({ icon: 'success', title: 'تم التعديل', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } catch (e) { Swal.fire('خطأ', 'فشل الحفظ', 'error'); }
};

window.deleteRow = async (id) => {
    const res = await Swal.fire({ title: 'حذف السجل؟', icon: 'warning', showCancelButton: true });
    if (res.isConfirmed) {
        await remove(ref(db, `Smart_Qabda/${id}`));
        loadData();
    }
};

// ==================== COMPLETE COLUMN MAPPING FOR ALL FILE TYPES (A1-A5) ====================

// For each standard column, list ALL possible source column names from any file type
const COLUMN_MAPPING = {
    // === Primary Key ===
    "رقم العداد": ["رقم العداد", "رقم العداد ", "SerialNum", "BadgeNumber", "رقم_العداد", "Meter Number", "Meter No", "No"],
    
    // === A3 Customer Data ===
    "كود المشترك": ["كود المشترك", "كود المشترك ", "كود_المشترك", "كودالمشترك", "Code", "كود"],
    "قطاع": ["قطاع", "قطاع ", "Sector", "Disco"],
    "فرع": ["فرع", "فرع ", "Branch", "DiscoBranch"],
    "منطقة": ["منطقة", "منطقة ", "Area"],
    "يومية": ["يومية", "يومية ", "Day Rate", "Daily"],
    "مرجع": ["مرجع", "مرجع ", "Reference"],
    "فرعى": ["فرعى", "فرعى ", "فرعي", "Sub Branch"],
    "وحده": ["وحده", "وحده ", "وحدة", "Unit"],
    "اسم المشترك": ["اسم المشترك", "اسم المشترك ", "اسم_المشترك", "Customer Name", "Subscriber Name"],
    "الرقم القومي": ["الرقم القومي", "الرقم القومي ", "National ID", "ID Number"],
    "العنوان": ["العنوان", "العنوان ", "Address", "Address4"],
    "رقم التليفون": ["رقم التليفون", "رقم التليفون ", "Phone", "Telephone"],
    "نوع الرسائل": ["نوع الرسائل", "نوع الرسائل ", "Message Type"],
    "نوع الرسائل.1": ["نوع الرسائل.1", "نوع الرسائل2", "نوع الرسائل 2"],
    "كود السداد": ["كود السداد", "كود السداد ", "Payment Code"],
    "حالة الاشتراك": ["حالة الاشتراك", "حالة الاشتراك ", "Status"],
    "الجهد": ["الجهد", "الجهد ", "Voltage"],
    "القدرة": ["القدرة", "القدرة ", "Capacity"],
    "معامل الضرب": ["معامل الضرب", "معامل الضرب ", "CT", "CT Ratio"],
    "تاريخ التعاقد": ["تاريخ التعاقد", "تاريخ التعاقد ", "Contract Date", "InstallationDate"],
    "نوع التعاقد العداد": ["نوع التعاقد العداد", "نوع التعاقد العداد ", "Contract Type", "نوع التعاقد// العداد"],
    "النشاط": ["النشاط", "النشاط ", "Activity"],
    "وصف المكانالغرض": ["وصف المكانالغرض", "وصف المكان/الغرض", "Description"],
    "Category": ["Category"],
    
    // === A1/A4 Kiosk/Transformer Location Data ===
    "Address (General Region)": ["Address (General Region)", "قطاع"],
    "Address (Region)": ["Address (Region)", "هندسة", "هندسة قري"],
    "Address (District)": ["Address (District)", "DistributionFacility", "محطة محولات"],
    "Phase Wire": ["Phase Wire", "Phase"],
    "Meter type name": ["Meter type name", "Meter Type"],
    "Manufactured company name": ["Manufactured company name", "Manufacturer"],
    "Manufactured year": ["Manufactured year", "Year"],
    "VT ratio": ["VT ratio"],
    "Pre-payment function": ["Pre-payment function"],
    "Name of connected KIOSK": ["Name of connected KIOSK", "KIOSK", "Name of connected KIOSK"],
    "Code of Feeder": ["Code of Feeder", "Feeder Code"],
    "Name of connected Feeder": ["Name of connected Feeder", "Feeder", "Name of connected Feeder"],
    
    // === A5 Meter Technical Data ===
    "SIM_S_Num": ["SIM_S_Num", "SIM_S_Num ", "SIM", "SIM Number"],
    "BadgeNumber": ["BadgeNumber", "BadgeNumber ", "Badge", "PO"],
    "Manufacturer": ["Manufacturer", "Manufacturer ", "Manufactured company name"],
    "Model": ["Model", "Model "],
    "TYPE": ["TYPE", "TYPE ", "Meter type name", "Meter Type", "DeviceFunction"],
    
    // === Location Coordinates ===
    "LatitudeY": ["LatitudeY", "Y", "Latitude"],
    "LongitudeX": ["LongitudeX", "X", "Longitude"],
    
    // === Additional Technical Fields ===
    "SerialNum": ["SerialNum", "Serial Number"],
    "EEHCUnifiedCode": ["EEHCUnifiedCode"],
    "FacilityDescription": ["FacilityDescription"],
    "DistributionFacility": ["DistributionFacility"],
    "LossesArea": ["LossesArea"],
    "DeviceFunction": ["DeviceFunction"],
    "KioskCode": ["KioskCode"],
    "DivisionCode": ["DivisionCode"],
    
    // === Date fields ===
    "rise_date_session": ["rise_date_session", "Date", "Session Date"],
    "InstallationDate": ["InstallationDate", "تاريخ التركيب"]
};

// Function to extract value from row using the mapping
function extractValue(row, standardColumn) {
    const possibleNames = COLUMN_MAPPING[standardColumn] || [standardColumn];
    for (const name of possibleNames) {
        const value = row[name];
        if (value !== undefined && value !== null && value !== "") {
            let val = value;
            if (val instanceof Date) {
                val = val.toLocaleDateString('en-GB');
            }
            return cleanVal(val);
        }
    }
    return "";
}

// Function to get meter number from any row (tries all possible sources)
function getMeterNumber(row) {
    const meterSources = COLUMN_MAPPING["رقم العداد"];
    for (const source of meterSources) {
        const value = row[source];
        if (value && value !== "") {
            let val = value;
            if (val instanceof Date) {
                val = val.toLocaleDateString('en-GB');
            }
            const cleanId = cleanVal(val);
            if (cleanId && !cleanId.toLowerCase().includes("po:")) {
                return cleanId;
            }
        }
    }
    return null;
}

// Detect file type based on columns (for debugging)
function detectFileType(columns) {
    const colSet = new Set(columns.map(c => String(c).toLowerCase()));
    if (colSet.has("كود المشترك") && colSet.has("اسم المشترك")) return "A3 (Customer)";
    if (colSet.has("sim_s_num") || colSet.has("badgenumber")) return "A5 (Technical)";
    if (colSet.has("address (general region)") || colSet.has("name of connected kiosk")) return "A1/A4 (Kiosk)";
    return "Unknown";
}

// ==================== MAIN PROCESSOR - Link ALL Data by Meter Number ====================

document.getElementById('processBtn').addEventListener('click', async () => {
    const files = document.getElementById('fileInput').files;
    const sessionDate = document.getElementById('RiseDate').value;

    if (files.length === 0 || !sessionDate) {
        return Swal.fire('تنبيه', 'يرجى اختيار ملف وتحديد التاريخ', 'warning');
    }

    showLoading('جاري معالجة الملفات وربط البيانات برقم العداد...');
    
    try {
        // Step 1: Read ALL data from ALL files and organize by meter number
        const meterDataMap = new Map(); // Key: meter number, Value: object with all merged data
        let totalRowsProcessed = 0;
        let rowsWithMeter = 0;
        let fileStats = [];
        
        for (const file of files) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            
            const columns = json.length > 0 ? Object.keys(json[0]) : [];
            const fileType = detectFileType(columns);
            
            console.log(`\n📄 Processing: ${file.name}`);
            console.log(`   Type: ${fileType}`);
            console.log(`   Rows: ${json.length}`);
            console.log(`   Columns: ${columns.slice(0, 10).join(', ')}${columns.length > 10 ? '...' : ''}`);
            
            let fileRowsWithMeter = 0;
            
            for (const row of json) {
                totalRowsProcessed++;
                
                // Get the meter number (primary key)
                const meterNumber = getMeterNumber(row);
                if (!meterNumber) {
                    continue;
                }
                
                fileRowsWithMeter++;
                rowsWithMeter++;
                
                const cleanMeterId = String(meterNumber).replace(/\s+/g, '').trim();
                
                // Get existing data for this meter or create new
                let meterRecord = meterDataMap.get(cleanMeterId) || {};
                
                // Extract ALL standard fields from this row
                let fieldsAdded = [];
                for (const standardColumn of FULL_COLUMNS) {
                    const value = extractValue(row, standardColumn);
                    if (value && value !== "") {
                        // Only add if not already present (first occurrence wins)
                        if (!meterRecord[standardColumn] || meterRecord[standardColumn] === "") {
                            meterRecord[standardColumn] = value;
                            fieldsAdded.push(standardColumn);
                        }
                    }
                }
                
                // Also capture any custom columns not in standard list
                for (const [key, value] of Object.entries(row)) {
                    if (value && value !== "") {
                        const cleanKey = sanitizeKey(key);
                        if (!meterRecord[cleanKey] && !FULL_COLUMNS.includes(key)) {
                            let cleanedValue = value;
                            if (cleanedValue instanceof Date) {
                                cleanedValue = cleanedValue.toLocaleDateString('en-GB');
                            }
                            meterRecord[cleanKey] = cleanVal(cleanedValue);
                        }
                    }
                }
                
                meterDataMap.set(cleanMeterId, meterRecord);
            }
            
            fileStats.push({
                name: file.name,
                type: fileType,
                rows: json.length,
                rowsWithMeter: fileRowsWithMeter,
                columns: columns.length
            });
            
            console.log(`   ✅ Rows with meter numbers: ${fileRowsWithMeter}/${json.length}`);
        }
        
        // Display summary statistics
        console.log("\n📊 ===== PROCESSING SUMMARY =====");
        console.table(fileStats);
        console.log(`\n📊 Total unique meter numbers found: ${meterDataMap.size}`);
        console.log(`📊 Total rows processed: ${totalRowsProcessed}`);
        console.log(`📊 Rows with valid meter numbers: ${rowsWithMeter}`);
        
        // Show sample of linked data
        if (meterDataMap.size > 0) {
            console.log("\n📋 SAMPLE OF LINKED DATA (First 3 meters):");
            const samples = Array.from(meterDataMap.entries()).slice(0, 3);
            samples.forEach(([meter, data], idx) => {
                console.log(`\n${idx + 1}. 🔢 Meter: ${meter}`);
                console.log(`   كود المشترك: ${data["كود المشترك"] || "❌"}`);
                console.log(`   قطاع: ${data["قطاع"] || "❌"}`);
                console.log(`   فرع: ${data["فرع"] || "❌"}`);
                console.log(`   منطقة: ${data["منطقة"] || "❌"}`);
                console.log(`   يومية: ${data["يومية"] || "❌"}`);
                console.log(`   مرجع: ${data["مرجع"] || "❌"}`);
                console.log(`   فرعى: ${data["فرعى"] || "❌"}`);
                console.log(`   وحده: ${data["وحده"] || "❌"}`);
                console.log(`   اسم المشترك: ${data["اسم المشترك"] || "❌"}`);
                console.log(`   الرقم القومي: ${data["الرقم القومي"] || "❌"}`);
                console.log(`   SIM_S_Num: ${data["SIM_S_Num"] || "❌"}`);
                console.log(`   Model: ${data["Model"] || "❌"}`);
                console.log(`   TYPE: ${data["TYPE"] || "❌"}`);
            });
        }
        
        if (meterDataMap.size === 0) {
            Swal.fire('تنبيه', 'لم يتم العثور على أي أرقام عدادات صالحة في الملفات. تأكد من وجود عمود "رقم العداد"', 'warning');
            return;
        }
        
        showLoading(`جاري رفع ${meterDataMap.size} سجل مرتبط...`);
        
        // Step 2: Get existing data from Firebase
        const existingSnap = await get(ref(db, 'Smart_Qabda'));
        const existingDataMap = existingSnap.exists() ? existingSnap.val() : {};
        
        // Step 3: Merge and prepare updates
        const updatesMap = {};
        let added = 0;
        let updated = 0;
        let fieldsCount = {};
        
        for (const [meterId, newData] of meterDataMap.entries()) {
            const firebaseKey = sanitizeKey(meterId);
            const existingData = existingDataMap[firebaseKey] || {};
            
            // Merge: preserve existing, only add missing fields
            const mergedRow = { ...existingData };
            let hasNewData = false;
            
            for (const [key, value] of Object.entries(newData)) {
                if (value && value !== "") {
                    // Only add if not already present in existing data
                    if (!existingData[key] || existingData[key] === "") {
                        mergedRow[key] = value;
                        hasNewData = true;
                        fieldsCount[key] = (fieldsCount[key] || 0) + 1;
                    }
                }
            }
            
            // Always add/update session date
            mergedRow["رقم العداد"] = meterId;
            mergedRow["rise_date_session"] = sessionDate;
            
            if (hasNewData || !existingDataMap[firebaseKey]) {
                updatesMap[firebaseKey] = mergedRow;
                if (existingDataMap[firebaseKey]) {
                    updated++;
                } else {
                    added++;
                }
            }
        }
        
        console.log("\n📝 FIELDS ADDED SUMMARY:");
        const sortedFields = Object.entries(fieldsCount).sort((a, b) => b[1] - a[1]);
        sortedFields.slice(0, 15).forEach(([field, count]) => {
            console.log(`   ${field}: ${count} meters`);
        });
        
        // Step 4: Batch write to Firebase
        if (Object.keys(updatesMap).length > 0) {
            const batchUpdate = {};
            Object.entries(updatesMap).forEach(([key, value]) => {
                batchUpdate[`Smart_Qabda/${key}`] = value;
            });
            
            await update(ref(db), batchUpdate);
            
            const populatedFields = Object.keys(fieldsCount).filter(f => fieldsCount[f] > 0);
            const totalMeters = Object.keys(updatesMap).length;
            
            Swal.fire({
                icon: 'success',
                title: '✅ تم الرفع والربط بنجاح',
                html: `
                    <div style="text-align: right; direction: rtl;">
                        <p><strong>📊 إحصائيات المعالجة:</strong></p>
                        <p>🆕 تمت إضافة: <strong>${added}</strong> عداد جديد</p>
                        <p>🔄 تم تحديث: <strong>${updated}</strong> عداد</p>
                        <p>📊 إجمالي: <strong>${totalMeters}</strong> عداد</p>
                        <hr>
                        <p><strong>📝 الحقول المضافة:</strong></p>
                        <p>${populatedFields.slice(0, 8).join(' • ')}${populatedFields.length > 8 ? ' • ...' : ''}</p>
                        <hr>
                        <p><strong>📁 تمت معالجة:</strong> ${files.length} ملف</p>
                        <p><strong>🔢 إجمالي الصفوف:</strong> ${totalRowsProcessed}</p>
                    </div>
                `,
                confirmButtonText: 'حسناً'
            }).then(() => loadData());
        } else {
            Swal.fire('مكتمل', 'جميع البيانات محدثة بالفعل', 'info');
        }
        
    } catch (e) { 
        console.error('❌ Error:', e);
        Swal.fire('خطأ', 'فشل في معالجة الملفات: ' + e.message, 'error'); 
    }
});

// ==================== Search & Filter ====================

document.getElementById('applyFilterBtn').addEventListener('click', () => {
    const meterVal = cleanVal(document.getElementById('searchMeter').value).toLowerCase();
    const simVal = cleanVal(document.getElementById('searchSIM').value).toLowerCase();
    const dateVal = document.getElementById('searchRiseDate').value;
    const regionVal = cleanVal(document.getElementById('searchGenRegion')?.value).toLowerCase();
    const typeVal = cleanVal(document.getElementById('filterType')?.value).toUpperCase();

    currentResults = cachedAllData.filter(item => {
        const mNum = (item["رقم العداد"] || "").toString().toLowerCase();
        const sNum = (item["SIM_S_Num"] || "").toString().toLowerCase();
        const rDate = item["rise_date_session"] || "";
        const region = (item["قطاع"] || item["Address (General Region)"] || "").toString().toLowerCase();
        const mType = (item["TYPE"] || item["Meter type name"] || "").toString().toUpperCase();

        const mMatch = meterVal ? mNum.includes(meterVal) : true;
        const sMatch = simVal ? sNum.includes(simVal) : true;
        const dMatch = dateVal ? rDate === dateVal : true;
        const rMatch = regionVal ? region.includes(regionVal) : true;
        const tMatch = typeVal ? mType.includes(typeVal) : true;

        return mMatch && sMatch && dMatch && rMatch && tMatch;
    });

    currentPage = 1;
    renderTable();
});

// ==================== Pagination & UI ====================

document.getElementById('nextPageBtn').onclick = () => { 
    if ((currentPage * ROWS_PER_PAGE) < currentResults.length) { 
        currentPage++; 
        renderTable(); 
    } 
};

document.getElementById('prevPageBtn').onclick = () => { 
    if (currentPage > 1) { 
        currentPage--; 
        renderTable(); 
    } 
};

document.getElementById('clearFiltersBtn').onclick = () => {
    document.querySelectorAll('.filter-grid input, .filter-grid select').forEach(i => i.value = "");
    currentResults = [...cachedAllData];
    currentPage = 1;
    renderTable();
};

const delAllBtn = document.getElementById('deleteAllDataBtn');
if (delAllBtn) {
    delAllBtn.addEventListener('click', async () => {
        const res = await Swal.fire({ title: 'مسح شامل؟', text: "سيتم حذف كل البيانات نهائياً", icon: 'error', showCancelButton: true });
        if (res.isConfirmed) { await remove(ref(db, 'Smart_Qabda')); loadData(); }
    });
}

// ==================== Export to Excel ====================

document.getElementById('exportBtn')?.addEventListener('click', () => {
    if (currentResults.length === 0) {
        Swal.fire('تنبيه', 'لا توجد بيانات للتصدير', 'warning');
        return;
    }
    
    const exportData = currentResults.map(item => {
        const exportItem = {};
        FULL_COLUMNS.forEach(col => {
            exportItem[col] = item[col] || item[sanitizeKey(col)] || "";
        });
        return exportItem;
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `meter_data_${new Date().toISOString().split('T')[0]}.xlsx`);
});

// ==================== DOM Content Loaded ====================
window.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const rInput = document.getElementById('RiseDate');
    if (rInput) rInput.value = today;
});

// ==================== Initialize ====================
loadData();