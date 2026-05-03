package com.emotiontranslate.backend.controllers;

import com.emotiontranslate.backend.models.TranslationHistory;
import com.emotiontranslate.backend.models.User;
import com.emotiontranslate.backend.repositories.HistoryRepository;
import com.emotiontranslate.backend.repositories.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin (HR Only)", description = "HR-only endpoints for managing all users and their history")
public class AdminController {

    private final UserRepository userRepository;
    private final HistoryRepository historyRepository;

    @GetMapping("/users")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "List all registered users (HR only)")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Get all translation history across all users (HR only)")
    public ResponseEntity<List<TranslationHistory>> getAllHistory() {
        return ResponseEntity.ok(historyRepository.findAll());
    }

    @DeleteMapping("/history/{id}")
    @PreAuthorize("hasRole('HR')")
    @Operation(summary = "Delete any history record by ID (HR only)")
    public ResponseEntity<?> deleteAnyHistory(@PathVariable Long id) {
        TranslationHistory history = historyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("History record not found"));
        historyRepository.delete(history);
        return ResponseEntity.ok().build();
    }
}
