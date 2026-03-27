package com.intelliquiz.api;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

import java.util.List;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Validates the Spring Modulith module structure.
 * Covers AC-1 (verify passes), AC-2 (9 modules), AC-3 (no illegal cross-module access),
 * AC-4 (internal types encapsulated), AC-10 (documentation), AC-13 (acyclic graph).
 */
class ModuleStructureTest {

    static final ApplicationModules modules = ApplicationModules.of(IntelliQuizApiApplication.class);

    @Test
    void shouldPassModuleVerification() {
        // AC-1: ApplicationModules.verify() passes
        // AC-3: No illegal cross-module access
        // AC-4: All internal/ types are encapsulated
        // AC-13: Module dependency graph is acyclic
        modules.verify();
    }

    @Test
    void shouldDetectAll9Modules() {
        // AC-2: 9 modules detected
        List<String> moduleNames = modules.stream()
                .map(m -> m.getName())
                .sorted()
                .toList();

        assertEquals(9, moduleNames.size(),
                "Expected 9 modules but found " + moduleNames.size() + ": " + moduleNames);

        List<String> expected = List.of(
                "auth", "backup", "quiz", "realtime", "scoreboard",
                "shared", "submission", "team", "user"
        );
        assertEquals(expected, moduleNames);
    }

    @Test
    void shouldGenerateDocumentation() {
        // AC-10: PlantUML documentation generated
        Documenter documenter = new Documenter(Objects.requireNonNull(modules));
        documenter.writeDocumentation();
    }
}
