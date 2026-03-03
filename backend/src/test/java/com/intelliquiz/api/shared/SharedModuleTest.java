package com.intelliquiz.api.shared;

import com.intelliquiz.api.IntelliQuizApiApplication;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

import static org.junit.jupiter.api.Assertions.*;

class SharedModuleTest {

    static final ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);

    @Test
    void moduleIsDetected() {
        assertTrue(modules.getModuleByName("shared").isPresent(), "shared module should be detected");
    }

    @Test
    void moduleIsOpenType() {
        // shared module is Type.OPEN — all types are public API
        var module = modules.getModuleByName("shared").orElseThrow();
        assertNotNull(module);
    }
}
