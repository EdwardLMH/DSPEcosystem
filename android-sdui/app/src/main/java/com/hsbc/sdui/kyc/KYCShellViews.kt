package com.hsbc.sdui.kyc

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

private val HsbcRed = Color(0xFFC41230)
private val N50     = Color(0xFFF8F8F8)
private val N200    = Color(0xFFE5E5E5)
private val N500    = Color(0xFF666666)
private val N700    = Color(0xFF333333)
private val N800    = Color(0xFF1A1A1A)
private val N900    = Color(0xFF0A0A0A)
private val White   = Color.White
private val Success = Color(0xFF2D7D46)

// ─── Root screen entry point ──────────────────────────────────────────────────

@Composable
fun KYCRootScreen(vm: KYCViewModel = viewModel()) {
    val state by vm.state.collectAsState()

    AnimatedContent(
        targetState = state.isComplete to (state.screenPayload != null),
        transitionSpec = { fadeIn() togetherWith fadeOut() },
        label = "KYCRoot"
    ) { (isComplete, hasPayload) ->
        when {
            isComplete  -> KYCCompletionScreen()
            hasPayload  -> KYCJourneyScreen(state, vm::setAnswer, vm::submitStep)
            else        -> KYCWelcomeScreen(state, vm::startSession)
        }
    }
}

// ─── Welcome screen ───────────────────────────────────────────────────────────

@Composable
private fun KYCWelcomeScreen(state: KYCUiState, onStart: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize().background(N50)) {
        Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
            // HSBC red accent bar
            Box(modifier = Modifier.fillMaxWidth().height(6.dp).background(HsbcRed))

            Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(24.dp)) {
                HSBCLogo()

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Open Banking\nAccount Opening",
                        fontSize = 28.sp, fontWeight = FontWeight.Bold, color = N900, lineHeight = 36.sp)
                    Text("Complete your KYC verification in minutes using Open Banking. Fully regulated by the HKMA.",
                        fontSize = 15.sp, color = Color(0xFF555555))
                }

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf(
                        Triple("👤", "Personal Details", "Name, DOB, nationality, address"),
                        Triple("🪪", "Identity Verification", "Government ID + liveness selfie"),
                        Triple("💼", "Due Diligence", "Occupation & source of funds"),
                        Triple("🏦", "Open Banking", "Connect bank for instant verification"),
                        Triple("✍️", "Declarations", "Legal declarations & consent")
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
                                    Text(desc, fontSize = 12.sp, color = N500)
                                }
                            }
                        }
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🔒", fontSize = 14.sp)
                    Spacer(Modifier.width(6.dp))
                    Text("Regulated by HKMA · Data protected under PDPO Cap. 486",
                        fontSize = 12.sp, color = N500)
                }

                state.errorMessage?.let {
                    Text(it, fontSize = 13.sp, color = Color(0xFFCC0000))
                }

                Button(
                    onClick = onStart,
                    enabled = !state.isLoading,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
                ) {
                    if (state.isLoading) {
                        CircularProgressIndicator(color = White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Text("Begin Application", fontWeight = FontWeight.SemiBold, fontSize = 16.sp, color = White)
                    }
                }

                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

// ─── Journey shell ────────────────────────────────────────────────────────────

@Composable
private fun KYCJourneyScreen(
    state: KYCUiState,
    onAnswer: (String, Any) -> Unit,
    onSubmit: () -> Unit
) {
    val payload = state.screenPayload ?: return
    val stepId = payload.metadata.stepId
    val progress = if (state.totalSteps > 0)
        state.currentStepIndex.toFloat() / state.totalSteps.toFloat() else 0f

    Scaffold(
        topBar = {
            Column {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(White)
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    HSBCLogo()
                    Text("Save & Exit", fontSize = 13.sp, color = N500)
                }
                Divider(color = N200)

                // Progress bar
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(White)
                        .padding(horizontal = 16.dp, vertical = 10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(state.sectionTitle, fontSize = 12.sp, color = N500)
                        Text("Step ${state.currentStepIndex} of ${state.totalSteps}",
                            fontSize = 12.sp, color = N500)
                    }
                    Spacer(Modifier.height(6.dp))
                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier.fillMaxWidth().height(4.dp)
                            .clip(RoundedCornerShape(2.dp)),
                        color = HsbcRed,
                        trackColor = N200
                    )
                }
                Divider(color = N200)
            }
        },
        bottomBar = {
            Column {
                Divider(color = N200)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(White)
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (state.currentStepIndex > 1) {
                        OutlinedButton(
                            onClick = {},
                            modifier = Modifier.height(52.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("← Back", color = N700)
                        }
                    }
                    Button(
                        onClick = onSubmit,
                        enabled = !state.isSubmitting,
                        modifier = Modifier.weight(1f).height(52.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
                    ) {
                        if (state.isSubmitting) {
                            CircularProgressIndicator(color = White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Text(
                                if (state.currentStepIndex >= state.totalSteps) "Submit Application" else "Continue",
                                fontWeight = FontWeight.SemiBold, color = White
                            )
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(N50)
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                // Section badge + title
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color(0xFFFFEEF0))
                            .padding(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text(state.sectionTitle,
                            fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = HsbcRed)
                    }
                    Text(kycStepTitle(primaryQuestionId(payload)),
                        fontSize = 20.sp, fontWeight = FontWeight.Bold, color = N900)
                }

                // Step content card
                Card(
                    colors = CardDefaults.cardColors(containerColor = White),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(Modifier.padding(16.dp)) {
                        KYCStepRouter(
                            primaryQuestionId = primaryQuestionId(payload),
                            stepId = stepId,
                            answers = state.answers,
                            onAnswer = onAnswer
                        )
                    }
                }

                state.errorMessage?.let {
                    Text(it, fontSize = 13.sp, color = Color(0xFFCC0000))
                }

                Spacer(Modifier.height(8.dp))
            }
        }

        if (state.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                Card(shape = RoundedCornerShape(12.dp)) {
                    Column(
                        modifier = Modifier.padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(color = HsbcRed)
                        Spacer(Modifier.height(12.dp))
                        Text("Loading…", fontSize = 14.sp, color = N700)
                    }
                }
            }
        }
    }
}


/** Extract primary question ID from SDUI payload — mirrors iOS KYCStepContentCard.questionIds */
fun primaryQuestionId(payload: SDUIScreenPayload): String {
    val children = payload.layout.children ?: return ""
    val first = children.firstOrNull() ?: return ""
    val props = first.props ?: return ""
    return props["questionId"] as? String ?: ""
}

// ─── Completion screen ────────────────────────────────────────────────────────

@Composable
private fun KYCCompletionScreen() {
    Box(
        modifier = Modifier.fillMaxSize().background(N50).padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            HSBCLogo()
            Text("✅", fontSize = 72.sp)
            Text("Application Submitted",
                fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Success)

            Card(
                colors = CardDefaults.cardColors(containerColor = N50),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf(
                        "📧" to "Confirmation email sent",
                        "📱" to "SMS notification will follow",
                        "⏱" to "Decision within 3 working days",
                        "🔒" to "Data encrypted per PDPO Cap. 486"
                    ).forEach { (icon, text) ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(icon, fontSize = 16.sp)
                            Spacer(Modifier.width(12.dp))
                            Text(text, fontSize = 14.sp, color = N700)
                        }
                    }
                }
            }

            Text(
                "Reference: OBKYC-${(100000..999999).random()}",
                fontSize = 12.sp, color = N500
            )
        }
    }
}

// ─── HSBC Logo ────────────────────────────────────────────────────────────────

@Composable
private fun HSBCLogo() {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Box(modifier = Modifier.size(28.dp).border(0.5.dp, N200)) {
            Column {
                Row {
                    Box(Modifier.size(14.dp).background(HsbcRed))
                    Box(Modifier.size(14.dp).background(White))
                }
                Row {
                    Box(Modifier.size(14.dp).background(White))
                    Box(Modifier.size(14.dp).background(HsbcRed))
                }
            }
        }
        Text("HSBC", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = N900,
            letterSpacing = 1.sp)
    }
}
