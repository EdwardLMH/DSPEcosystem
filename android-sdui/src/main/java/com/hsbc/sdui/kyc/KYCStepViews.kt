package com.hsbc.sdui.kyc

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ─── Hive Tokens (inline for Android KYC module) ──────────────────────────────

private val HsbcRed    = Color(0xFFC41230)
private val HsbcGold   = Color(0xFFC9A84C)
private val N50        = Color(0xFFF8F8F8)
private val N100       = Color(0xFFF0F0F0)
private val N200       = Color(0xFFE5E5E5)
private val N300       = Color(0xFFCCCCCC)
private val N400       = Color(0xFF999999)
private val N500       = Color(0xFF666666)
private val N700       = Color(0xFF333333)
private val N800       = Color(0xFF1A1A1A)
private val N900       = Color(0xFF0A0A0A)
private val Success    = Color(0xFF2D7D46)
private val SuccessLt  = Color(0xFFEFF7F2)
private val ErrorColor = Color(0xFFCC0000)
private val White      = Color.White

private val InputHeight = 52.dp
private val BtnHeight   = 52.dp
private val Radius      = 8.dp
private val RadiusMd    = 12.dp

// ─── Field wrapper ────────────────────────────────────────────────────────────

@Composable
private fun FieldGroup(
    title: String,
    required: Boolean = false,
    help: String? = null,
    error: String? = null,
    content: @Composable () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row {
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = N700
            )
            if (required) {
                Text(" *", color = ErrorColor, fontSize = 14.sp)
            }
        }
        help?.let {
            Text(it, fontSize = 12.sp, color = N500, modifier = Modifier.padding(top = 2.dp))
        }
        Spacer(Modifier.height(6.dp))
        content()
        error?.let {
            Text(it, fontSize = 12.sp, color = ErrorColor, modifier = Modifier.padding(top = 4.dp))
        }
    }
}

// ─── STEP 1: Full Legal Name ──────────────────────────────────────────────────

@Composable
fun KYCNameStep(
    answers: Map<String, Any>,
    onAnswer: (String, Any) -> Unit
) {
    var firstName  by remember { mutableStateOf(answers["q_first_name"]  as? String ?: "") }
    var middleName by remember { mutableStateOf(answers["q_middle_name"] as? String ?: "") }
    var lastName   by remember { mutableStateOf(answers["q_last_name"]   as? String ?: "") }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FieldGroup("First Name / Given Name", required = true,
            help = "As it appears on your official ID document") {
            OutlinedTextField(
                value = firstName,
                onValueChange = { firstName = it; onAnswer("q_first_name", it) },
                placeholder = { Text("e.g. Tai Man", color = N400) },
                modifier = Modifier.fillMaxWidth().height(InputHeight),
                shape = RoundedCornerShape(Radius),
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
                singleLine = true
            )
        }
        FieldGroup("Middle Name", help = "If applicable") {
            OutlinedTextField(
                value = middleName,
                onValueChange = { middleName = it; onAnswer("q_middle_name", it) },
                placeholder = { Text("(optional)", color = N400) },
                modifier = Modifier.fillMaxWidth().height(InputHeight),
                shape = RoundedCornerShape(Radius),
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
                singleLine = true
            )
        }
        FieldGroup("Last Name / Surname", required = true) {
            OutlinedTextField(
                value = lastName,
                onValueChange = { lastName = it; onAnswer("q_last_name", it) },
                placeholder = { Text("e.g. CHAN", color = N400) },
                modifier = Modifier.fillMaxWidth().height(InputHeight),
                shape = RoundedCornerShape(Radius),
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
                singleLine = true
            )
        }
    }
}

// ─── STEP 2: Date of Birth + Nationality ─────────────────────────────────────

@Composable
fun KYCDobNationalityStep(
    answers: Map<String, Any>,
    onAnswer: (String, Any) -> Unit
) {
    var dob         by remember { mutableStateOf(answers["q_dob"]         as? String ?: "") }
    var nationality by remember { mutableStateOf(answers["q_nationality"] as? String ?: "") }
    var showSheet   by remember { mutableStateOf(false) }

    val countries = listOf(
        "HK" to "🇭🇰 Hong Kong SAR",
        "CN" to "🇨🇳 Mainland China",
        "SG" to "🇸🇬 Singapore",
        "GB" to "🇬🇧 United Kingdom",
        "US" to "🇺🇸 United States",
        "AU" to "🇦🇺 Australia",
        "IN" to "🇮🇳 India",
        "JP" to "🇯🇵 Japan",
        "OTHER" to "Other"
    )
    val natLabel = countries.find { it.first == nationality }?.second ?: "Select nationality"

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FieldGroup("Date of Birth", required = true, help = "You must be at least 18 years old") {
            OutlinedTextField(
                value = dob,
                onValueChange = { dob = it; onAnswer("q_dob", it) },
                placeholder = { Text("YYYY-MM-DD", color = N400) },
                modifier = Modifier.fillMaxWidth().height(InputHeight),
                shape = RoundedCornerShape(Radius),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true
            )
        }
        FieldGroup("Nationality", required = true) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(InputHeight)
                    .clip(RoundedCornerShape(Radius))
                    .border(1.dp, N300, RoundedCornerShape(Radius))
                    .background(White)
                    .clickable { showSheet = true }
                    .padding(horizontal = 16.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        natLabel,
                        color = if (nationality.isEmpty()) N400 else N800,
                        fontSize = 15.sp
                    )
                    Text("▼", color = N400, fontSize = 12.sp)
                }
            }
        }
    }

    if (showSheet) {
        ModalBottomSheet(onDismissRequest = { showSheet = false }) {
            Text("Select Nationality", fontWeight = FontWeight.SemiBold, fontSize = 16.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp))
            Divider()
            LazyColumn {
                items(countries) { (code, label) ->
                    ListItem(
                        headlineContent = { Text(label) },
                        trailingContent = {
                            if (code == nationality)
                                Text("✓", color = Success, fontWeight = FontWeight.Bold)
                        },
                        modifier = Modifier.clickable {
                            nationality = code
                            onAnswer("q_nationality", code)
                            showSheet = false
                        }
                    )
                    Divider()
                }
            }
            Spacer(Modifier.height(40.dp))
        }
    }
}

// ─── STEP 3: Contact Details ──────────────────────────────────────────────────

@Composable
fun KYCContactStep(
    answers: Map<String, Any>,
    onAnswer: (String, Any) -> Unit
) {
    var phone by remember { mutableStateOf(answers["q_phone"] as? String ?: "") }
    var email by remember { mutableStateOf(answers["q_email"] as? String ?: "") }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FieldGroup("Mobile Phone Number", required = true,
            help = "Enter local HK number (8 digits)") {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .height(InputHeight)
                        .clip(RoundedCornerShape(Radius))
                        .border(1.dp, N300, RoundedCornerShape(Radius))
                        .background(N50)
                        .padding(horizontal = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("🇭🇰 +852", fontSize = 14.sp, color = N800)
                }
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it; onAnswer("q_phone", "+852$it") },
                    placeholder = { Text("91234567", color = N400) },
                    modifier = Modifier.weight(1f).height(InputHeight),
                    shape = RoundedCornerShape(Radius),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true
                )
            }
        }
        FieldGroup("Email Address", required = true,
            help = "We'll send your application confirmation here") {
            OutlinedTextField(
                value = email,
                onValueChange = { email = it; onAnswer("q_email", it) },
                placeholder = { Text("name@example.com", color = N400) },
                modifier = Modifier.fillMaxWidth().height(InputHeight),
                shape = RoundedCornerShape(Radius),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true
            )
        }
    }
}

// ─── STEP 4: Government ID ────────────────────────────────────────────────────

@Composable
fun KYCIdentifierStep(
    answers: Map<String, Any>,
    onAnswer: (String, Any) -> Unit
) {
    val idTypes = listOf(
        Triple("HKID",      "HKID (Hong Kong)",                   "A123456(7)"),
        Triple("PASSPORT",  "Passport",                            "X12345678"),
        Triple("MAINLAND",  "Mainland China ID (居民身份証)",       "110101199001011234"),
        Triple("NRIC",      "NRIC (Singapore)",                    "S1234567D"),
        Triple("OTHER",     "Other National ID",                   "")
    )
    var idType   by remember { mutableStateOf(answers["q_id_type"]   as? String ?: "") }
    var idNumber by remember { mutableStateOf(answers["q_id_number"] as? String ?: "") }
    var showSheet by remember { mutableStateOf(false) }
    val typeLabel = idTypes.find { it.first == idType }?.second ?: "Select ID type"

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FieldGroup("ID Document Type", required = true) {
            Box(
                modifier = Modifier
                    .fillMaxWidth().height(InputHeight)
                    .clip(RoundedCornerShape(Radius))
                    .border(1.dp, N300, RoundedCornerShape(Radius))
                    .background(White)
                    .clickable { showSheet = true }
                    .padding(horizontal = 16.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(typeLabel, color = if (idType.isEmpty()) N400 else N800, fontSize = 15.sp)
                    Text("▼", color = N400, fontSize = 12.sp)
                }
            }
        }
        if (idType.isNotEmpty()) {
            val placeholder = idTypes.find { it.first == idType }?.third ?: ""
            FieldGroup("ID Number", required = true,
                help = if (placeholder.isNotEmpty()) "Format: $placeholder" else null) {
                OutlinedTextField(
                    value = idNumber,
                    onValueChange = { idNumber = it; onAnswer("q_id_number", it) },
                    placeholder = { Text(placeholder, color = N400) },
                    modifier = Modifier.fillMaxWidth().height(InputHeight),
                    shape = RoundedCornerShape(Radius),
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
                    singleLine = true
                )
            }
        }
    }

    if (showSheet) {
        ModalBottomSheet(onDismissRequest = { showSheet = false }) {
            Text("Select ID Type", fontWeight = FontWeight.SemiBold, fontSize = 16.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp))
            Divider()
            LazyColumn {
                items(idTypes) { (code, label, _) ->
                    ListItem(
                        headlineContent = { Text(label) },
                        trailingContent = {
                            if (code == idType) Text("✓", color = Success, fontWeight = FontWeight.Bold)
                        },
                        modifier = Modifier.clickable {
                            idType = code
                            onAnswer("q_id_type", code)
                            idNumber = ""
                            showSheet = false
                        }
                    )
                    Divider()
                }
            }
            Spacer(Modifier.height(40.dp))
        }
    }
}

// ─── STEP 5: Residential Address ──────────────────────────────────────────────

@Composable
fun KYCAddressStep(
    answers: Map<String, Any>,
    onAnswer: (String, Any) -> Unit
) {
    var flat     by remember { mutableStateOf(answers["q_addr_flat"]     as? String ?: "") }
    var floor    by remember { mutableStateOf(answers["q_addr_floor"]    as? String ?: "") }
    var building by remember { mutableStateOf(answers["q_addr_building"] as? String ?: "") }
    var street   by remember { mutableStateOf(answers["q_addr_street"]   as? String ?: "") }
    var district by remember { mutableStateOf(answers["q_addr_district"] as? String ?: "") }
    var showDist by remember { mutableStateOf(false) }

    val districts = listOf(
        "central_western" to "Central & Western (中西區)",
        "eastern"         to "Eastern (東區)",
        "wan_chai"        to "Wan Chai (灣仔)",
        "kowloon_city"    to "Kowloon City (九龍城)",
        "kwun_tong"       to "Kwun Tong (觀塘)",
        "sham_shui_po"    to "Sham Shui Po (深水埗)",
        "yau_tsim_mong"   to "Yau Tsim Mong (油尖旺)",
        "sha_tin"         to "Sha Tin (沙田)",
        "tai_po"          to "Tai Po (大埔)",
        "islands"         to "Islands (離島)"
    )

    fun sendAddress() {
        val addr = listOf(flat, floor, building, street, district)
            .filter { it.isNotBlank() }.joinToString(", ")
        onAnswer("q_address", addr)
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(Color(0xFFFFEEF0))
                .padding(horizontal = 12.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("📍", fontSize = 12.sp)
            Spacer(Modifier.width(6.dp))
            Text("Hong Kong Address Format",
                fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = HsbcRed)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FieldGroup("Flat / Unit", modifier = Modifier.weight(1f)) {
                OutlinedTextField(flat, { flat = it; sendAddress() },
                    placeholder = { Text("e.g. Flat B", color = N400) },
                    modifier = Modifier.fillMaxWidth().height(InputHeight),
                    shape = RoundedCornerShape(Radius), singleLine = true)
            }
            FieldGroup("Floor", modifier = Modifier.weight(1f)) {
                OutlinedTextField(floor, { floor = it; sendAddress() },
                    placeholder = { Text("e.g. 12/F", color = N400) },
                    modifier = Modifier.fillMaxWidth().height(InputHeight),
                    shape = RoundedCornerShape(Radius), singleLine = true)
            }
        }
        FieldGroup("Building Name", required = true) {
            OutlinedTextField(building, { building = it; sendAddress() },
                placeholder = { Text("Building / Estate name", color = N400) },
                modifier = Modifier.fillMaxWidth().height(InputHeight),
                shape = RoundedCornerShape(Radius), singleLine = true)
        }
        FieldGroup("Street Address", required = true) {
            OutlinedTextField(street, { street = it; sendAddress() },
                placeholder = { Text("e.g. 28 Kings Road", color = N400) },
                modifier = Modifier.fillMaxWidth().height(InputHeight),
                shape = RoundedCornerShape(Radius), singleLine = true)
        }
        FieldGroup("District", required = true) {
            val distLabel = districts.find { it.first == district }?.second ?: "Select district"
            Box(
                modifier = Modifier
                    .fillMaxWidth().height(InputHeight)
                    .clip(RoundedCornerShape(Radius))
                    .border(1.dp, N300, RoundedCornerShape(Radius))
                    .background(White)
                    .clickable { showDist = true }
                    .padding(horizontal = 16.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
                    Text(distLabel, color = if (district.isEmpty()) N400 else N800, fontSize = 15.sp)
                    Text("▼", color = N400, fontSize = 12.sp)
                }
            }
        }
    }

    if (showDist) {
        ModalBottomSheet(onDismissRequest = { showDist = false }) {
            Text("Select District", fontWeight = FontWeight.SemiBold, fontSize = 16.sp,
                modifier = Modifier.padding(16.dp, 12.dp))
            Divider()
            LazyColumn {
                items(districts) { (code, label) ->
                    ListItem(
                        headlineContent = { Text(label) },
                        trailingContent = {
                            if (code == district) Text("✓", color = Success, fontWeight = FontWeight.Bold)
                        },
                        modifier = Modifier.clickable {
                            district = code
                            onAnswer("q_addr_district", code)
                            sendAddress()
                            showDist = false
                        }
                    )
                    Divider()
                }
            }
            Spacer(Modifier.height(40.dp))
        }
    }
}

// ─── Overloaded FieldGroup with Modifier ──────────────────────────────────────

@Composable
private fun FieldGroup(
    title: String,
    required: Boolean = false,
    help: String? = null,
    error: String? = null,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Column(modifier = modifier) {
        Row {
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = N700)
            if (required) Text(" *", color = ErrorColor, fontSize = 14.sp)
        }
        help?.let { Text(it, fontSize = 12.sp, color = N500, modifier = Modifier.padding(top = 2.dp)) }
        Spacer(Modifier.height(6.dp))
        content()
        error?.let { Text(it, fontSize = 12.sp, color = ErrorColor, modifier = Modifier.padding(top = 4.dp)) }
    }
}

// ─── STEP 6: Document Upload ──────────────────────────────────────────────────

@Composable
fun KYCDocumentStep(
    answers: Map<String, Any>,
    onAnswer: (String, Any) -> Unit
) {
    var docType   by remember { mutableStateOf(answers["q_doc_type"] as? String ?: "") }
    var frontDone by remember { mutableStateOf(answers["q_doc_front"] != null) }
    var backDone  by remember { mutableStateOf(answers["q_doc_back"] != null) }
    var showType  by remember { mutableStateOf(false) }

    val docTypes = listOf("HKID" to "Hong Kong Identity Card", "PASSPORT" to "Passport")
    val typeLabel = docTypes.find { it.first == docType }?.second ?: "Select document type"

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FieldGroup("Document Type", required = true) {
            Box(
                modifier = Modifier
                    .fillMaxWidth().height(InputHeight)
                    .clip(RoundedCornerShape(Radius))
                    .border(1.dp, N300, RoundedCornerShape(Radius))
                    .background(White)
                    .clickable { showType = true }
                    .padding(horizontal = 16.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
                    Text(typeLabel, color = if (docType.isEmpty()) N400 else N800, fontSize = 15.sp)
                    Text("▼", color = N400, fontSize = 12.sp)
                }
            }
        }
        if (docType.isNotEmpty()) {
            DocUploadZone(
                label = "Front / Photo Page",
                hint = "Hold flat, ensure all corners are visible",
                isDone = frontDone,
                onCapture = { frontDone = true; onAnswer("q_doc_front", "captured") }
            )
            if (docType == "HKID") {
                DocUploadZone(
                    label = "Back Side",
                    hint = "Required for HKID",
                    isDone = backDone,
                    onCapture = { backDone = true; onAnswer("q_doc_back", "captured") }
                )
            }
            if (frontDone) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(Radius))
                        .background(SuccessLt)
                        .border(1.dp, Success, RoundedCornerShape(Radius))
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("✓ Quality checklist", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Success)
                    listOf(
                        "All four corners are visible",
                        "Text is clear and readable — no blurring",
                        "No glare or shadows",
                        "Document is not expired"
                    ).forEach { check ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("✔", color = Success, fontSize = 12.sp)
                            Spacer(Modifier.width(8.dp))
                            Text(check, fontSize = 12.sp, color = N700)
                        }
                    }
                }
            }
        }
    }

    if (showType) {
        ModalBottomSheet(onDismissRequest = { showType = false }) {
            Text("Select Document Type", fontWeight = FontWeight.SemiBold, fontSize = 16.sp,
                modifier = Modifier.padding(16.dp, 12.dp))
            Divider()
            docTypes.forEach { (code, label) ->
                ListItem(
                    headlineContent = { Text(label) },
                    trailingContent = {
                        if (code == docType) Text("✓", color = Success, fontWeight = FontWeight.Bold)
                    },
                    modifier = Modifier.clickable {
                        docType = code
                        onAnswer("q_doc_type", code)
                        showType = false
                    }
                )
                Divider()
            }
            Spacer(Modifier.height(40.dp))
        }
    }
}

@Composable
private fun DocUploadZone(
    label: String,
    hint: String,
    isDone: Boolean,
    onCapture: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = N700)
        Text(hint, fontSize = 12.sp, color = N500)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp)
                .clip(RoundedCornerShape(RadiusMd))
                .background(if (isDone) SuccessLt else N50)
                .border(
                    width = 2.dp,
                    color = if (isDone) Success else N300,
                    shape = RoundedCornerShape(RadiusMd)
                )
                .clickable { onCapture() },
            contentAlignment = Alignment.Center
        ) {
            if (isDone) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("✓", fontSize = 32.sp, color = Success)
                    Text("Captured — tap to retake", fontSize = 12.sp, color = Success)
                }
            } else {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("📷", fontSize = 32.sp)
                    Text("Take Photo or Upload", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = N700)
                    Text("JPG, PNG or PDF · Max 10MB", fontSize = 12.sp, color = N400)
                }
            }
        }
    }
}

// ─── STEP 7: Liveness ─────────────────────────────────────────────────────────

@Composable
fun KYCLivenessStep(onAnswer: (String, Any) -> Unit) {
    var phase by remember { mutableStateOf("instructions") }
    var progress by remember { mutableStateOf(0f) }

    LaunchedEffect(phase) {
        if (phase == "processing") {
            var p = 0f
            while (p < 1f) {
                kotlinx.coroutines.delay(50)
                p = minOf(p + 0.02f, 1f)
                progress = p
            }
            kotlinx.coroutines.delay(300)
            phase = "done"
            onAnswer("q_liveness", "PASSED")
        }
    }

    when (phase) {
        "instructions" -> {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F0FE)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text("🔒 Liveness Detection — Identity Verification",
                            fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = N800)
                        Spacer(Modifier.height(4.dp))
                        Text("We verify you are a real person matching your ID. This takes ~30 seconds.",
                            fontSize = 13.sp, color = N700)
                    }
                }
                listOf(
                    Triple("😊", "Face the camera", "Position in the oval guide with good lighting."),
                    Triple("👁️", "Follow the prompts", "You may be asked to blink or turn slightly."),
                    Triple("📸", "Stay still", "Hold steady while we capture your image.")
                ).forEach { (icon, title, desc) ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = White),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier.size(44.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFFFEEF0)),
                                contentAlignment = Alignment.Center
                            ) { Text(icon, fontSize = 22.sp) }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(title, fontWeight = FontWeight.Medium, fontSize = 14.sp, color = N800)
                                Text(desc, fontSize = 12.sp, color = N600)
                            }
                        }
                    }
                }
                Button(
                    onClick = { phase = "processing" },
                    modifier = Modifier.fillMaxWidth().height(BtnHeight),
                    shape = RoundedCornerShape(Radius),
                    colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
                ) { Text("Begin Liveness Check", color = White, fontWeight = FontWeight.SemiBold) }
            }
        }
        "processing" -> {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxWidth().padding(24.dp)
            ) {
                CircularProgressIndicator(color = HsbcRed, modifier = Modifier.size(56.dp))
                Text("Verifying your identity…", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                    color = HsbcRed
                )
                Text("Matching against your ID using facial recognition…",
                    fontSize = 12.sp, color = N500, textAlign = TextAlign.Center)
            }
        }
        "done" -> {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(RadiusMd))
                    .background(SuccessLt)
                    .border(1.dp, Success, RoundedCornerShape(RadiusMd))
                    .padding(24.dp)
            ) {
                Text("✅", fontSize = 56.sp)
                Text("Liveness Check Passed",
                    fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Success)
                Text("Facial match confidence: 98.4%\nYour identity has been verified.",
                    fontSize = 13.sp, color = N700, textAlign = TextAlign.Center)
            }
        }
    }
}

private val N600 = Color(0xFF555555)

// ─── STEP 8: Source of Wealth ─────────────────────────────────────────────────

@Composable
fun KYCWealthStep(
    answers: Map<String, Any>,
    onAnswer: (String, Any) -> Unit
) {
    var occupation  by remember { mutableStateOf(answers["q_occupation"]     as? String ?: "") }
    var income      by remember { mutableStateOf(answers["q_annual_income"]  as? String ?: "") }
    var fundsSource by remember { mutableStateOf(answers["q_source_of_funds"] as? String ?: "") }
    var purpose     by remember { mutableStateOf(answers["q_account_purpose"] as? String ?: "") }

    val occupations = listOf(
        "BANKING_FINANCE" to "Banking & Finance", "ACCOUNTING" to "Accounting & Auditing",
        "LEGAL" to "Legal & Compliance", "MEDICAL" to "Medical & Healthcare",
        "ENGINEERING" to "Engineering & Technology", "EDUCATION" to "Education",
        "REAL_ESTATE" to "Real Estate", "SELF_EMPLOYED" to "Self-employed / Freelance",
        "BUSINESS_OWNER" to "Business Owner", "INVESTMENT" to "Investment & Asset Management",
        "RETIRED" to "Retired", "STUDENT" to "Student", "OTHER" to "Other"
    )
    val incomeBands = listOf(
        "BELOW_150K" to "Below HKD 150,000", "150K_300K" to "HKD 150,000 – 300,000",
        "300K_600K" to "HKD 300,000 – 600,000", "600K_1M" to "HKD 600,000 – 1,000,000",
        "1M_3M" to "HKD 1,000,000 – 3,000,000", "ABOVE_3M" to "Above HKD 3,000,000"
    )
    val fundsSources = listOf(
        "EMPLOYMENT" to "Employment / Salary", "BUSINESS" to "Business Income",
        "INVESTMENT" to "Investment Returns", "INHERITANCE" to "Inheritance / Gift",
        "PROPERTY" to "Property Sale", "SAVINGS" to "Accumulated Savings", "OTHER" to "Other"
    )
    val purposes = listOf(
        "EVERYDAY_BANKING" to "Everyday banking & payments", "SAVINGS" to "Savings & deposits",
        "INVESTMENT" to "Investment & wealth management", "SALARY_RECEIPT" to "Salary / income receipt",
        "INTERNATIONAL_TRANSFER" to "International money transfers", "MORTGAGE" to "Mortgage repayments"
    )

    var activeSheet by remember { mutableStateOf<String?>(null) }

    @Composable
    fun PickerRow(label: String, value: String, options: List<Pair<String, String>>, key: String, setter: (String) -> Unit) {
        FieldGroup(label, required = true) {
            val chosen = options.find { it.first == value }?.second ?: "Select $label"
            Box(
                modifier = Modifier
                    .fillMaxWidth().height(InputHeight)
                    .clip(RoundedCornerShape(Radius))
                    .border(1.dp, N300, RoundedCornerShape(Radius))
                    .background(White)
                    .clickable { activeSheet = key }
                    .padding(horizontal = 16.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
                    Text(chosen, color = if (value.isEmpty()) N400 else N800, fontSize = 15.sp)
                    Text("▼", color = N400, fontSize = 12.sp)
                }
            }
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        PickerRow("Occupation / Industry", occupation, occupations, "occ") { occupation = it; onAnswer("q_occupation", it) }
        PickerRow("Annual Income (HKD)", income, incomeBands, "inc") { income = it; onAnswer("q_annual_income", it) }
        PickerRow("Primary Source of Funds", fundsSource, fundsSources, "funds") { fundsSource = it; onAnswer("q_source_of_funds", it) }
        PickerRow("Purpose of Account", purpose, purposes, "purpose") { purpose = it; onAnswer("q_account_purpose", it) }
    }

    val sheetOptions = when (activeSheet) {
        "occ"    -> occupations to { v: String -> occupation = v; onAnswer("q_occupation", v) }
        "inc"    -> incomeBands to { v: String -> income = v; onAnswer("q_annual_income", v) }
        "funds"  -> fundsSources to { v: String -> fundsSource = v; onAnswer("q_source_of_funds", v) }
        "purpose" -> purposes to { v: String -> purpose = v; onAnswer("q_account_purpose", v) }
        else -> null
    }

    sheetOptions?.let { (opts, onSelect) ->
        ModalBottomSheet(onDismissRequest = { activeSheet = null }) {
            LazyColumn {
                items(opts) { (code, label) ->
                    ListItem(
                        headlineContent = { Text(label) },
                        modifier = Modifier.clickable { onSelect(code); activeSheet = null }
                    )
                    Divider()
                }
            }
            Spacer(Modifier.height(40.dp))
        }
    }
}

// ─── STEP 9: Open Banking ─────────────────────────────────────────────────────

@Composable
fun KYCOpenBankingStep(onAnswer: (String, Any) -> Unit) {
    var selectedBank by remember { mutableStateOf("") }
    var connected    by remember { mutableStateOf(false) }
    var connecting   by remember { mutableStateOf(false) }
    var showBankSheet by remember { mutableStateOf(false) }

    val banks = listOf(
        "HSBC_UK" to "HSBC UK", "LLOYDS" to "Lloyds Bank", "BARCLAYS" to "Barclays",
        "NATWEST" to "NatWest", "MONZO" to "Monzo", "STARLING" to "Starling Bank"
    )
    val bankLabel = banks.find { it.first == selectedBank }?.second ?: "Select your bank"

    LaunchedEffect(connecting) {
        if (connecting) {
            kotlinx.coroutines.delay(1500)
            connecting = false
            connected = true
            onAnswer("q_ob_consent", "tok_${(100000..999999).random()}")
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F4FD)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(Modifier.padding(16.dp)) {
                Text("🔒 Open Banking — Secure Account Connection",
                    fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = N800)
                Spacer(Modifier.height(4.dp))
                Text("We use Open Banking (FCA/HKMA regulated) to verify your identity. Your bank credentials are never shared with HSBC.",
                    fontSize = 13.sp, color = N700)
            }
        }
        FieldGroup("Your current bank", required = true) {
            Box(
                modifier = Modifier
                    .fillMaxWidth().height(InputHeight)
                    .clip(RoundedCornerShape(Radius))
                    .border(1.dp, N300, RoundedCornerShape(Radius))
                    .background(White)
                    .clickable { showBankSheet = true }
                    .padding(horizontal = 16.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
                    Text(bankLabel, color = if (selectedBank.isEmpty()) N400 else N800, fontSize = 15.sp)
                    Text("▼", color = N400, fontSize = 12.sp)
                }
            }
        }
        if (connected) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(Radius))
                    .background(SuccessLt)
                    .border(1.dp, Success, RoundedCornerShape(Radius))
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("🏦", fontSize = 28.sp)
                Spacer(Modifier.width(12.dp))
                Column {
                    Text("Bank Connected Successfully",
                        fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = Success)
                    Text("Account ownership verified · Consent token issued · 90-day access",
                        fontSize = 12.sp, color = N600)
                }
            }
        } else {
            Button(
                onClick = { connecting = true },
                enabled = selectedBank.isNotEmpty() && !connecting,
                modifier = Modifier.fillMaxWidth().height(BtnHeight),
                shape = RoundedCornerShape(Radius),
                colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
            ) {
                if (connecting) {
                    CircularProgressIndicator(color = White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    Spacer(Modifier.width(8.dp))
                }
                Text("Connect to ${bankLabel.ifEmpty { "your bank" }} securely",
                    color = White, fontWeight = FontWeight.SemiBold)
            }
        }
        Text("Powered by Open Banking · Regulated by FCA and HKMA",
            fontSize = 11.sp, color = N400, textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth())
    }

    if (showBankSheet) {
        ModalBottomSheet(onDismissRequest = { showBankSheet = false }) {
            Text("Select Bank", fontWeight = FontWeight.SemiBold, fontSize = 16.sp,
                modifier = Modifier.padding(16.dp, 12.dp))
            Divider()
            LazyColumn {
                items(banks) { (code, label) ->
                    ListItem(
                        headlineContent = { Text(label) },
                        trailingContent = {
                            if (code == selectedBank) Text("✓", color = Success, fontWeight = FontWeight.Bold)
                        },
                        modifier = Modifier.clickable {
                            selectedBank = code
                            showBankSheet = false
                        }
                    )
                    Divider()
                }
            }
            Spacer(Modifier.height(40.dp))
        }
    }
}

// ─── STEP 10: Declarations ────────────────────────────────────────────────────

@Composable
fun KYCDeclarationStep(
    answers: Map<String, Any>,
    onAnswer: (String, Any) -> Unit
) {
    var pepStatus by remember { mutableStateOf(answers["q_pep_status"] as? String ?: "") }
    var decl1     by remember { mutableStateOf(answers["decl_truthful"] as? Boolean ?: false) }
    var decl2     by remember { mutableStateOf(answers["decl_fatca"]    as? Boolean ?: false) }

    val pepOptions = listOf(
        "NO"     to "I am not a PEP and not related to a PEP",
        "YES"    to "I am a PEP or closely related to a PEP",
        "FORMER" to "I was a PEP more than 12 months ago"
    )

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Politically Exposed Person (PEP) Status",
                fontSize = 14.sp, fontWeight = FontWeight.Medium, color = N700)
            Text("A PEP holds or has held a prominent public position in the last 12 months",
                fontSize = 12.sp, color = N500)
            pepOptions.forEach { (value, label) ->
                val selected = pepStatus == value
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(Radius))
                        .background(if (selected) Color(0xFFFFEEF0) else N50)
                        .border(1.dp, if (selected) HsbcRed else N200, RoundedCornerShape(Radius))
                        .clickable { pepStatus = value; onAnswer("q_pep_status", value) }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier.size(20.dp)
                            .clip(CircleShape)
                            .border(2.dp, if (selected) HsbcRed else N300, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        if (selected) Box(Modifier.size(10.dp).clip(CircleShape).background(HsbcRed))
                    }
                    Spacer(Modifier.width(12.dp))
                    Text(label, fontSize = 14.sp, color = N700, modifier = Modifier.weight(1f))
                }
            }
        }

        listOf(
            Triple("decl_truthful", decl1, "All information provided is true, accurate and complete to the best of my knowledge."),
            Triple("decl_fatca", decl2, "I confirm I am NOT a US person for FATCA purposes (no US citizenship, Green Card, or tax residency).")
        ).forEach { (id, checked, text) ->
            val isOn = if (id == "decl_truthful") decl1 else decl2
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(Radius))
                    .background(if (isOn) SuccessLt else N50)
                    .border(1.dp, if (isOn) Success else N200, RoundedCornerShape(Radius))
                    .clickable {
                        if (id == "decl_truthful") { decl1 = !decl1; onAnswer(id, decl1) }
                        else { decl2 = !decl2; onAnswer(id, decl2) }
                    }
                    .padding(16.dp),
                verticalAlignment = Alignment.Top
            ) {
                Box(
                    modifier = Modifier.size(22.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .border(2.dp, if (isOn) Success else N300, RoundedCornerShape(4.dp))
                        .background(if (isOn) Success else Color.Transparent),
                    contentAlignment = Alignment.Center
                ) {
                    if (isOn) Text("✓", color = White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.width(12.dp))
                Text(text, fontSize = 13.sp, color = N700, modifier = Modifier.weight(1f))
            }
        }

        Text(
            "By submitting, you consent to HSBC processing your personal data under the Personal Data (Privacy) Ordinance (Cap. 486) and HSBC's Privacy Notice.",
            fontSize = 11.sp, color = N400,
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(Radius))
                .background(N100)
                .padding(12.dp)
        )
    }
}
