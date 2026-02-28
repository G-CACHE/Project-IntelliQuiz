package com.intelliquiz.api.backup;

import com.intelliquiz.api.IntelliQuizApiApplication;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

import static org.junit.jupiter.api.Assertions.*;

class BackupModuleTest {

    static final ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);

    @Test
    void moduleIsDetected() {
        assertTrue(modules.getModuleByName("backup").isPresent(), "backup module should be detected");
    }

    @Test
    void facadeIsAccessible() {
        assertDoesNotThrow(() -> Class.forName("com.intelliquiz.api.backup.BackupFacade"));
    }
}
