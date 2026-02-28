package com.intelliquiz.api.scoreboard;

import com.intelliquiz.api.IntelliQuizApiApplication;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

import static org.junit.jupiter.api.Assertions.*;

class ScoreboardModuleTest {

    static final ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);

    @Test
    void moduleIsDetected() {
        assertTrue(modules.getModuleByName("scoreboard").isPresent(), "scoreboard module should be detected");
    }

    @Test
    void facadeIsAccessible() {
        assertDoesNotThrow(() -> Class.forName("com.intelliquiz.api.scoreboard.ScoreboardFacade"));
    }
}
