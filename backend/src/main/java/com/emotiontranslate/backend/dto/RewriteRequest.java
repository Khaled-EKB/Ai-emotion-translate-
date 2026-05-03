package com.emotiontranslate.backend.dto;

import lombok.Data;

@Data
public class RewriteRequest {
    private String text;
    private String targetEmotion;
}
