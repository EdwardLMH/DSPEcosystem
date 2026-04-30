package com.hsbc.sdui.components.kyc

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
// Hive tokens — defined locally since no external Hive library is present.
import com.hsbc.sdui.models.HiveBorderRadius
import com.hsbc.sdui.models.HiveColor
import com.hsbc.sdui.models.HiveComponent
import com.hsbc.sdui.models.HiveElevation
import com.hsbc.sdui.models.HiveSpacing
import com.hsbc.sdui.models.HiveTypography

private val HsbcRed   = HiveColor.Brand.Primary
private val HsbcGreen = HiveColor.Semantic.Success

// ─── KYC Text Input ───────────────────────────────────────────────────────────

data class KYCValidation(
    val required: Boolean = false,
    val minLength: Int? = null,
    val maxLength: Int? = null,
    val pattern: String? = null,
    val errorMessage: String? = null
)

@Composable
fun KYCTextInputComposable(
    questionId: String,
    label: String,
    placeholder: String = "",
    helpText: String? = null,
    validation: KYCValidation? = null,
    savedValue: String? = null,
    onAnswer: (String, String) -> Unit
) {
    var value by remember { mutableStateOf(savedValue ?: "") }
    var error by remember { mutableStateOf<String?>(null) }
    var touched by remember { mutableStateOf(false) }

    fun validate(v: String): String? {
        val vl = validation ?: return null
        if (vl.required && v.isBlank()) return vl.errorMessage ?: "This field is required"
        vl.minLength?.let { if (v.length < it) return "Minimum $it characters" }
        vl.pattern?.let {
            if (!Regex(it).matches(v)) return vl.errorMessage ?: "Invalid format"
        }
        return null
    }

    Column(modifier = Modifier.fillMaxWidth().padding(vertical = HiveSpacing.s1)) {
        Row {
            Text(label, style = HiveTypography.labelBase, color = HiveColor.Neutral.N700)
            if (validation?.required == true) {
                Text(" *", color = HiveColor.Semantic.Error, style = HiveTypography.labelBase)
            }
        }
        helpText?.let {
            Text(it, style = HiveTypography.caption, color = HiveColor.Neutral.N500,
                modifier = Modifier.padding(top = HiveSpacing.s1))
        }
        OutlinedTextField(
            value = value,
            onValueChange = { v ->
                value = v
                if (touched) error = validate(v)
            },
            placeholder = { Text(placeholder, color = HiveColor.Neutral.N400,
                                  style = HiveTypography.bodyBase) },
            isError = touched && error != null,
            textStyle = HiveTypography.bodyBase,
            modifier = Modifier.fillMaxWidth().padding(top = HiveSpacing.s1)
                .height(HiveComponent.Input.height),
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Words,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(onDone = {
                touched = true
                error = validate(value)
                if (error == null) onAnswer(questionId, value)
            }),
            shape = RoundedCornerShape(HiveComponent.Input.borderRadius),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = HiveComponent.Input.focusColor,
                unfocusedBorderColor = HiveComponent.Input.borderColor,
                errorBorderColor = HiveComponent.Input.errorColor,
                focusedContainerColor = HiveComponent.Input.bgColor,
                unfocusedContainerColor = HiveComponent.Input.bgColor,
            )
        )
        if (touched && error != null) {
            Text(error!!, color = HiveColor.Semantic.Error, style = HiveTypography.caption,
                modifier = Modifier.padding(top = HiveSpacing.s1))
        }
    }
}

// ─── KYC Single Select — Modal Bottom Sheet ───────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KYCSingleSelectComposable(
    questionId: String,
    label: String,
    options: List<Pair<String, String>>,   // value to label
    savedValue: String? = null,
    onAnswer: (String, String) -> Unit
) {
    var selected by remember { mutableStateOf(savedValue) }
    var showSheet by remember { mutableStateOf(false) }
    val selectedLabel = options.find { it.first == selected }?.second ?: "Select an option"

    Column(modifier = Modifier.fillMaxWidth().padding(vertical = HiveSpacing.s1)) {
        Text(label, style = HiveTypography.labelBase, color = HiveColor.Neutral.N700)
        Spacer(Modifier.height(HiveSpacing.s1))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(HiveComponent.Input.borderRadius))
                .border(1.dp, HiveComponent.Input.borderColor,
                        RoundedCornerShape(HiveComponent.Input.borderRadius))
                .background(HiveComponent.Input.bgColor)
                .clickable { showSheet = true }
                .padding(horizontal = HiveComponent.Input.paddingH,
                         vertical = HiveComponent.Input.paddingV),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(selectedLabel,
                color = if (selected == null) HiveColor.Neutral.N400 else HiveColor.Neutral.N800,
                style = HiveTypography.bodyBase)
            Text("▼", color = HiveColor.Neutral.N500, style = HiveTypography.caption)
        }
    }

    if (showSheet) {
        ModalBottomSheet(onDismissRequest = { showSheet = false }) {
            Text(label, fontWeight = FontWeight.SemiBold, fontSize = 16.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp))
            Divider()
            LazyColumn {
                items(options) { (value, optLabel) ->
                    ListItem(
                        headlineContent = { Text(optLabel) },
                        trailingContent = {
                            if (value == selected) Text("✓", color = HsbcGreen, fontWeight = FontWeight.Bold)
                        },
                        modifier = Modifier.clickable {
                            selected = value
                            showSheet = false
                            onAnswer(questionId, value)
                        }
                    )
                    Divider()
                }
            }
            Spacer(Modifier.height(32.dp))
        }
    }
}

// ─── KYC Progress Bar ─────────────────────────────────────────────────────────

@Composable
fun KYCProgressBarComposable(
    currentStep: Int,
    totalSteps: Int,
    sectionTitle: String,
    sectionProgress: String? = null
) {
    val progress = currentStep.toFloat() / totalSteps.toFloat()
    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = HiveSpacing.s4, vertical = HiveSpacing.s2)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(sectionTitle, style = HiveTypography.caption, color = HiveColor.Neutral.N500)
            Text(sectionProgress ?: "Step $currentStep of $totalSteps",
                style = HiveTypography.caption, color = HiveColor.Neutral.N500)
        }
        Spacer(Modifier.height(HiveSpacing.s1))
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier.fillMaxWidth()
                .height(HiveComponent.ProgressBar.height)
                .clip(RoundedCornerShape(HiveBorderRadius.full)),
            color = HiveComponent.ProgressBar.fillColor,
            trackColor = HiveComponent.ProgressBar.trackColor
        )
    }
}

// ─── KYC Navigation Bar ───────────────────────────────────────────────────────

@Composable
fun KYCNavigationBarComposable(
    showBack: Boolean,
    showSaveExit: Boolean,
    nextLabel: String,
    isLoading: Boolean = false,
    onBack: (() -> Unit)? = null,
    onSaveExit: (() -> Unit)? = null,
    onNext: () -> Unit
) {
    Surface(shadowElevation = HiveElevation.navBar) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(HiveSpacing.s4),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(HiveSpacing.s2)) {
                if (showBack) {
                    OutlinedButton(onClick = { onBack?.invoke() },
                        border = BorderStroke(1.dp, HiveColor.Neutral.N300)) {
                        Text("← Back", style = HiveTypography.bodyBase,
                            color = HiveColor.Neutral.N700)
                    }
                }
                if (showSaveExit) {
                    TextButton(onClick = { onSaveExit?.invoke() }) {
                        Text("Save & Exit", style = HiveTypography.bodyBase,
                            color = HiveColor.Brand.Primary)
                    }
                }
            }
            Button(
                onClick = onNext,
                enabled = !isLoading,
                modifier = Modifier.height(HiveComponent.Button.height),
                contentPadding = PaddingValues(horizontal = HiveComponent.Button.paddingH),
                shape = RoundedCornerShape(HiveComponent.Button.borderRadius),
                colors = ButtonDefaults.buttonColors(
                    containerColor = HiveComponent.Button.bgColor,
                    disabledContainerColor = HiveColor.Neutral.N300
                )
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = HiveColor.Brand.White,
                        modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                } else {
                    Text(nextLabel, style = HiveComponent.Button.textStyle,
                        color = HiveComponent.Button.textColor)
                }
            }
        }
    }
}

// ─── KYC Declaration ─────────────────────────────────────────────────────────

@Composable
fun KYCDeclarationComposable(
    questionId: String,
    label: String,
    declarationText: String,
    onAnswer: (String, Boolean) -> Unit
) {
    var checked by remember { mutableStateOf(false) }
    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Text(label, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
        Spacer(Modifier.height(12.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth().height(200.dp)
                .border(1.dp, Color.LightGray, RoundedCornerShape(8.dp))
                .padding(12.dp)
        ) {
            Text(declarationText, fontSize = 13.sp, color = Color.DarkGray,
                lineHeight = 20.sp)
        }
        Spacer(Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.clickable {
                checked = !checked
                onAnswer(questionId, checked)
            }) {
            Checkbox(checked = checked, onCheckedChange = { v ->
                checked = v; onAnswer(questionId, v)
            }, colors = CheckboxDefaults.colors(checkedColor = HsbcRed))
            Spacer(Modifier.width(8.dp))
            Text("I have read and agree to the above declaration", fontSize = 14.sp)
        }
    }
}
