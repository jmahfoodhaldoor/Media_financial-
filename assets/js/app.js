// ⚠️ هام جداً: ضعي الرابط اللي نسختيه من جوجل سكريبت (Web App URL) هنا:
const API_URL = "https://script.google.com/macros/s/AKfycbzIz7Xz_hnIt92kkSZCk6WKfYr4YxaonGBBWzOSTLLOnjOv8sGMYTKnpN_zAUolMKfS/exec";

document.addEventListener("DOMContentLoaded", () => {
    // تعيين تاريخ اليوم كافتراضي
    document.getElementById('date').valueAsDate = new Date();
    
    // جلب القوائم المنسدلة عند فتح الصفحة
    fetchDropdownLists();
});

// دالة لجلب البيانات من شيت Lists
async function fetchDropdownLists() {
    try {
        const response = await fetch(API_URL);
        const lists = await response.json();
        
        populateSelect('category', lists.categories);
        populateSelect('member', lists.members);
        
        // إذا شيت اللجنة المالية فارغ، حطينا قيم افتراضية
        if (lists.financeCommittees && lists.financeCommittees.length > 0) {
            populateSelect('financeCommittee', lists.financeCommittees);
        } else {
            const defaultFinance = ['تم التسليم ✅', 'لم يتم التسليم ⏳', 'قيد المتابعة 🔄', 'بانتظار توثيق 📝', 'مرفوض ⚠️'];
            populateSelect('financeCommittee', defaultFinance);
        }
    } catch (error) {
        console.error("Error fetching lists:", error);
        document.getElementById('messageBox').innerHTML = `<div class="alert alert-danger">خطأ في الاتصال بالسيرفر لجلب القوائم.</div>`;
    }
}

function populateSelect(elementId, items) {
    const select = document.getElementById(elementId);
    select.innerHTML = '';
    items.forEach(item => {
        if(item) {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            select.appendChild(option);
        }
    });
}

// معالجة إرسال الفورم
document.getElementById('expenseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = document.getElementById('submitBtn');
    const messageBox = document.getElementById('messageBox');
    const fileInput = document.getElementById('attachment');
    const file = fileInput.files[0];

    btn.disabled = true;
    btn.innerHTML = 'جاري الحفظ والرفع... ⏳';
    messageBox.innerHTML = '';

    // تجميع البيانات
    const requestData = {
        date: document.getElementById('date').value,
        vendor: document.getElementById('vendor').value,
        amount: document.getElementById('amount').value,
        category: document.getElementById('category').value,
        member: document.getElementById('member').value,
        status: document.getElementById('status').value,
        financeCommittee: document.getElementById('financeCommittee').value,
        invoiceNo: document.getElementById('invoiceNo').value,
        description: document.getElementById('description').value
    };

    try {
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                // استخراج الـ base64 بدون الـ prefix
                requestData.fileBase64 = e.target.result.split(',')[1];
                requestData.fileName = file.name;
                requestData.fileMimeType = file.type;
                
                await sendDataToBackend(requestData);
            };
            reader.readAsDataURL(file);
        } else {
            await sendDataToBackend(requestData);
        }
    } catch (error) {
        showError(error.message);
    }
});

async function sendDataToBackend(data) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // تجنباً لمشاكل CORS في Google Apps Script
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('messageBox').innerHTML = `
                <div class="alert alert-success mt-3">
                    ${result.message} <br>
                    <small>ID العملية: <strong>${result.txnId}</strong></small>
                </div>
                <button type="button" class="btn btn-outline-primary mt-2" onclick="location.reload()">إضافة عملية جديدة</button>
            `;
            document.getElementById('expenseForm').style.display = 'none';
        } else {
            showError(result.message);
        }
    } catch (error) {
        showError("حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.");
        console.error(error);
    }
}

function showError(msg) {
    document.getElementById('messageBox').innerHTML = `<div class="alert alert-danger">${msg}</div>`;
    const btn = document.getElementById('submitBtn');
    btn.disabled = false;
    btn.innerHTML = 'حفظ العملية 💾';
}
