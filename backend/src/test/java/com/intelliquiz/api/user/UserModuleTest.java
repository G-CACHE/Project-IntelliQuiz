package com.intelliquiz.api.user;

import com.intelliquiz.api.IntelliQuizApiApplication;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

import static org.junit.jupiter.api.Assertions.*;

class UserModuleTest {

    static final ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);

    @Test
    void moduleIsDetected() {
        assertTrue(modules.getModuleByName("user").isPresent(), "user module should be detected");
    }

    @Test
    void facadeIsAccessible() {
        assertDoesNotThrow(() -> Class.forName("com.intelliquiz.api.user.UserFacade"));
    }
}
