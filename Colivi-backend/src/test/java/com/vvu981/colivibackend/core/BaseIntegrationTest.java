package com.vvu981.colivibackend.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vvu981.colivibackend.core.storage.service.IImageStorageService;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect",
        "zonky.test.database.postgres.client.properties.stringtype=unspecified"
    }
)
@AutoConfigureMockMvc
@AutoConfigureEmbeddedDatabase(
    provider = AutoConfigureEmbeddedDatabase.DatabaseProvider.ZONKY,
    type = AutoConfigureEmbeddedDatabase.DatabaseType.POSTGRES,
    refresh = AutoConfigureEmbeddedDatabase.RefreshMode.AFTER_CLASS
)
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @MockBean
    protected IImageStorageService imageStorageService;

    @MockBean
    protected JavaMailSender javaMailSender;
}
