package com.emotiontranslate.backend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnthropicService {

    @Value("${anthropic.api.key}")
    private String apiKey;

    private final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String analyzeEmotions(String text) {
        if (apiKey == null || apiKey.equals("dummy_key")) {
            throw new RuntimeException("Anthropic API Key is not configured.");
        }

        String prompt = String.format("Analyze the emotions in the following text. " +
                "Return the result STRICTLY as a JSON array of emotion strings. " +
                "Example: [\"happy\", \"excited\"]\n\nText: \"%s\"", text);

        return callAnthropic(prompt);
    }

    public String rewriteWithEmotion(String text, String targetEmotion) {
        if (apiKey == null || apiKey.equals("dummy_key")) {
            throw new RuntimeException("Anthropic API Key is not configured.");
        }

        String prompt = String.format("Rewrite the following text to convey a strictly %s emotion. " +
                "Return ONLY the rewritten text, with no introductory or concluding remarks.\n\nText: \"%s\"", targetEmotion, text);

        return callAnthropic(prompt);
    }

    private String callAnthropic(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "claude-3-haiku-20240307");
        requestBody.put("max_tokens", 1024);
        
        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        
        requestBody.put("messages", List.of(message));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(ANTHROPIC_URL, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("content").get(0).path("text").asText().trim();
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse Anthropic response");
        } catch (Exception e) {
            throw new RuntimeException("Failed to call Anthropic API: " + e.getMessage());
        }
    }
}
