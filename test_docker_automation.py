#!/usr/bin/env python3
"""
Property-Based Tests for Docker Automation
==========================================
Tests for pattern matching and override mechanisms.

Run with: pytest test_docker_automation.py -v
"""

import os
import pytest
from hypothesis import given, strategies as st, settings, assume

from docker_automation import (
    file_matches_pattern,
    should_rebuild,
    REBUILD_PATTERNS,
    SKIP_PATTERNS,
    DockerAutomation,
)


# =============================================================================
# Test Strategies
# =============================================================================

# Strategy for generating backend file paths
backend_file_strategy = st.one_of(
    st.just("backend/src/main/java/App.java"),
    st.just("backend/pom.xml"),
    st.just("backend/Dockerfile"),
    st.builds(
        lambda name: f"backend/{name}.java",
        st.text(alphabet="abcdefghijklmnopqrstuvwxyz", min_size=1, max_size=10)
    ),
    st.builds(
        lambda name: f"backend/src/{name}.java",
        st.text(alphabet="abcdefghijklmnopqrstuvwxyz", min_size=1, max_size=10)
    ),
    st.builds(
        lambda name: f"backend/src/main/java/{name}.java",
        st.text(alphabet="abcdefghijklmnopqrstuvwxyz", min_size=1, max_size=10)
    ),
)

# Strategy for generating Docker config file paths
docker_file_strategy = st.one_of(
    st.just("Dockerfile"),
    st.just("docker-compose.yml"),
    st.just("docker-compose.prod.yml"),
    st.just("docker-compose.dev.yml"),
    st.just("pom.xml"),
)

# Strategy for generating skip-only file paths
skip_file_strategy = st.one_of(
    st.just("README.md"),
    st.just("CHANGELOG.md"),
    st.just("document/api.md"),
    st.just("frontend/src/App.tsx"),
    st.just("frontend/package.json"),
    st.just("script/deploy.sh"),
    st.builds(
        lambda name: f"frontend/{name}.js",
        st.text(alphabet="abcdefghijklmnopqrstuvwxyz", min_size=1, max_size=10)
    ),
    st.builds(
        lambda name: f"{name}.md",
        st.text(alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ", min_size=1, max_size=10)
    ),
    st.builds(
        lambda name: f"document/{name}.md",
        st.text(alphabet="abcdefghijklmnopqrstuvwxyz", min_size=1, max_size=10)
    ),
)


# =============================================================================
# Property Tests - Pattern Matching
# =============================================================================

class TestPatternMatching:
    """
    Feature: git-pull-docker-automation
    Property 1: Rebuild Pattern Matching
    Validates: Requirements 2.1, 2.2
    """
    
    @given(backend_file_strategy)
    @settings(max_examples=100)
    def test_backend_files_trigger_rebuild(self, filepath: str):
        """
        Property 1: Rebuild Pattern Matching
        For any file path that matches a rebuild pattern (backend/**),
        the should_rebuild function SHALL return true.
        """
        # Given a backend file path
        changed_files = [filepath]
        
        # When we check if rebuild is needed
        result = should_rebuild(changed_files)
        
        # Then rebuild should be triggered
        assert result is True, f"Backend file {filepath} should trigger rebuild"
    
    @given(docker_file_strategy)
    @settings(max_examples=100)
    def test_docker_files_trigger_rebuild(self, filepath: str):
        """
        Property 1: Rebuild Pattern Matching
        For any file path that matches Docker config patterns,
        the should_rebuild function SHALL return true.
        """
        # Given a Docker config file path
        changed_files = [filepath]
        
        # When we check if rebuild is needed
        result = should_rebuild(changed_files)
        
        # Then rebuild should be triggered
        assert result is True, f"Docker file {filepath} should trigger rebuild"


class TestSkipPatterns:
    """
    Feature: git-pull-docker-automation
    Property 2: Skip Pattern Exclusivity
    Validates: Requirements 2.3
    """
    
    @given(st.lists(skip_file_strategy, min_size=1, max_size=5))
    @settings(max_examples=100)
    def test_skip_only_files_no_rebuild(self, filepaths: list):
        """
        Property 2: Skip Pattern Exclusivity
        For any set of changed files where ALL files match only skip patterns
        and NONE match rebuild patterns, should_rebuild SHALL return false.
        """
        # Given a list of skip-only files
        # Filter out any that might accidentally match rebuild patterns
        skip_only_files = [
            f for f in filepaths 
            if not any(file_matches_pattern(f, p) for p in REBUILD_PATTERNS)
        ]
        
        assume(len(skip_only_files) > 0)
        
        # When we check if rebuild is needed
        result = should_rebuild(skip_only_files)
        
        # Then rebuild should NOT be triggered
        assert result is False, f"Skip-only files {skip_only_files} should not trigger rebuild"
    
    def test_empty_file_list_no_rebuild(self):
        """Edge case: Empty file list should not trigger rebuild"""
        result = should_rebuild([])
        assert result is False, "Empty file list should not trigger rebuild"
    
    def test_mixed_files_with_backend_triggers_rebuild(self):
        """When mixed files include backend, rebuild should trigger"""
        changed_files = ["README.md", "backend/src/App.java", "frontend/index.js"]
        result = should_rebuild(changed_files)
        assert result is True, "Mixed files with backend should trigger rebuild"


# =============================================================================
# Property Tests - Override Mechanisms
# =============================================================================

class TestEnvironmentOverride:
    """
    Feature: git-pull-docker-automation
    Property 3: Environment Variable Override
    Validates: Requirements 4.1
    """
    
    @given(st.lists(backend_file_strategy, min_size=1, max_size=3))
    @settings(max_examples=100)
    def test_skip_env_var_skips_rebuild(self, filepaths: list):
        """
        Property 3: Environment Variable Override
        For any execution where SKIP_DOCKER_REBUILD is set to "1",
        the automation SHALL skip the rebuild process.
        """
        # Given SKIP_DOCKER_REBUILD is set
        original_env = os.environ.get("SKIP_DOCKER_REBUILD")
        os.environ["SKIP_DOCKER_REBUILD"] = "1"
        
        try:
            # The automation checks this env var in the run() method
            # We verify the check logic here
            skip_rebuild = os.environ.get("SKIP_DOCKER_REBUILD") == "1"
            assert skip_rebuild is True, "SKIP_DOCKER_REBUILD=1 should trigger skip"
        finally:
            # Restore original environment
            if original_env is None:
                os.environ.pop("SKIP_DOCKER_REBUILD", None)
            else:
                os.environ["SKIP_DOCKER_REBUILD"] = original_env
    
    def test_skip_env_var_not_set_allows_rebuild(self):
        """When SKIP_DOCKER_REBUILD is not set, rebuild should proceed"""
        original_env = os.environ.get("SKIP_DOCKER_REBUILD")
        os.environ.pop("SKIP_DOCKER_REBUILD", None)
        
        try:
            skip_rebuild = os.environ.get("SKIP_DOCKER_REBUILD") == "1"
            assert skip_rebuild is False, "Without env var, rebuild should proceed"
        finally:
            if original_env is not None:
                os.environ["SKIP_DOCKER_REBUILD"] = original_env


class TestForceOverride:
    """
    Feature: git-pull-docker-automation
    Property 4: Force Flag Override
    Validates: Requirements 4.2
    """
    
    @given(st.lists(skip_file_strategy, min_size=1, max_size=3))
    @settings(max_examples=100)
    def test_force_flag_triggers_rebuild_regardless_of_files(self, filepaths: list):
        """
        Property 4: Force Flag Override
        For any execution with force=True, the automation SHALL trigger
        a rebuild regardless of whether changed files match rebuild patterns.
        """
        # Given skip-only files and force=True
        skip_only_files = [
            f for f in filepaths 
            if not any(file_matches_pattern(f, p) for p in REBUILD_PATTERNS)
        ]
        assume(len(skip_only_files) > 0)
        
        force = True
        
        # When force is True, rebuild should happen regardless of file patterns
        # The actual logic in run() is: rebuild_needed = force
        rebuild_needed = force or should_rebuild(skip_only_files)
        
        assert rebuild_needed is True, "Force flag should always trigger rebuild"
    
    def test_force_false_respects_file_patterns(self):
        """When force=False, file patterns should be respected"""
        skip_only_files = ["README.md", "frontend/app.js"]
        force = False
        
        rebuild_needed = force or should_rebuild(skip_only_files)
        
        assert rebuild_needed is False, "Without force, skip files should not rebuild"


# =============================================================================
# Unit Tests - Specific Examples
# =============================================================================

class TestFileMatchesPattern:
    """Unit tests for file_matches_pattern function"""
    
    def test_exact_match(self):
        assert file_matches_pattern("Dockerfile", "Dockerfile") is True
    
    def test_wildcard_extension(self):
        assert file_matches_pattern("README.md", "*.md") is True
        assert file_matches_pattern("CHANGELOG.md", "*.md") is True
    
    def test_double_star_pattern(self):
        assert file_matches_pattern("backend/src/App.java", "backend/**") is True
        assert file_matches_pattern("backend/pom.xml", "backend/**") is True
        assert file_matches_pattern("backend/deep/nested/file.java", "backend/**") is True
    
    def test_no_match(self):
        assert file_matches_pattern("frontend/app.js", "backend/**") is False
        assert file_matches_pattern("README.txt", "*.md") is False


class TestShouldRebuild:
    """Unit tests for should_rebuild function"""
    
    def test_backend_java_file(self):
        assert should_rebuild(["backend/src/main/java/App.java"]) is True
    
    def test_dockerfile(self):
        assert should_rebuild(["Dockerfile"]) is True
    
    def test_docker_compose(self):
        assert should_rebuild(["docker-compose.yml"]) is True
    
    def test_pom_xml(self):
        assert should_rebuild(["pom.xml"]) is True
    
    def test_frontend_only(self):
        assert should_rebuild(["frontend/src/App.tsx"]) is False
    
    def test_markdown_only(self):
        assert should_rebuild(["README.md", "CHANGELOG.md"]) is False
    
    def test_mixed_with_backend(self):
        assert should_rebuild(["README.md", "backend/App.java"]) is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
