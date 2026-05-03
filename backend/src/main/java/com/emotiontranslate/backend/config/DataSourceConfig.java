package com.emotiontranslate.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    public DataSource dataSource() throws URISyntaxException {
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            // Fallback for local development if DATABASE_URL is not set
            return DataSourceBuilder.create()
                    .url("jdbc:mysql://localhost:3306/AI?createDatabaseIfNotExist=true")
                    .username("Kh")
                    .password("Kh 2006")
                    .build();
        }

        // Parse postgresql://user:pass@host:port/dbname
        URI dbUri = new URI(databaseUrl);
        
        String username = null;
        String password = null;
        
        if (dbUri.getUserInfo() != null) {
            String[] credentials = dbUri.getUserInfo().split(":");
            username = credentials[0];
            if (credentials.length > 1) {
                password = credentials[1];
            }
        }

        String jdbcUrl = "jdbc:mysql://" + dbUri.getHost() + ':' + dbUri.getPort() + dbUri.getPath() + "?createDatabaseIfNotExist=true";

        return DataSourceBuilder.create()
                .url(jdbcUrl)
                .username(username)
                .password(password)
                .build();
    }
}
