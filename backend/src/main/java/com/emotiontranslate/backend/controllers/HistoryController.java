package com.emotiontranslate.backend.controllers;

import com.emotiontranslate.backend.models.TranslationHistory;
import com.emotiontranslate.backend.models.User;
import com.emotiontranslate.backend.repositories.HistoryRepository;
import com.emotiontranslate.backend.repositories.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
@Tag(name = "History", description = "Manage your translation history")
public class HistoryController {

    private final HistoryRepository historyRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    @Operation(summary = "Get all history for the current user")
    public ResponseEntity<List<TranslationHistory>> getHistory() {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(historyRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single history record by ID")
    public ResponseEntity<TranslationHistory> getHistoryById(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        TranslationHistory history = historyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("History record not found"));
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a history record by ID")
    public ResponseEntity<?> deleteHistory(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        TranslationHistory history = historyRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("History record not found"));
        
        historyRepository.delete(history);
        return ResponseEntity.ok().build();
    }
}
