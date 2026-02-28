package com.intelliquiz.api.team;

import com.intelliquiz.api.IntelliQuizApiApplication;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

import static org.junit.jupiter.api.Assertions.*;

class TeamModuleTest {

    static final ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);

    @Test
    void moduleIsDetected() {
        assertTrue(modules.getModuleByName("team").isPresent(), "team module should be detected");
    }

    @Test
    void facadeIsAccessible() {
        assertDoesNotThrow(() -> Class.forName("com.intelliquiz.api.team.TeamFacade"));
    }
}
