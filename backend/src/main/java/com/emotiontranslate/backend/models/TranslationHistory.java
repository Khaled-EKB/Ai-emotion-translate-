package com.emotiontranslate.backend.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
public class TranslationHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String originalText;

    @Column(columnDefinition = "TEXT")
    private String translatedText;

    private String emotions; // JSON string
    private String targetEmotion;
    private String detectedLanguage;
    private String targetLanguage;

    private LocalDateTime createdAt = LocalDateTime.now();
}
