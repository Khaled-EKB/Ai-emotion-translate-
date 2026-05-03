package com.emotiontranslate.backend.repositories;

import com.emotiontranslate.backend.models.TranslationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface HistoryRepository extends JpaRepository<TranslationHistory, Long> {
    List<TranslationHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<TranslationHistory> findByIdAndUserId(Long id, Long userId);
}
