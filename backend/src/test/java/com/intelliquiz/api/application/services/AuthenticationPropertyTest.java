package com.intelliquiz.api.application.services;

import com.intelliquiz.api.auth.internal.application.services.AuthenticationResult;
import com.intelliquiz.api.auth.internal.application.services.AuthenticationService;
import com.intelliquiz.api.user.UserFacade;
import com.intelliquiz.api.user.dto.UserCredentialsDto;
import com.intelliquiz.api.shared.enums.SystemRole;
import com.intelliquiz.api.shared.domain.ports.PasswordHashingService;
import net.jqwik.api.*;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for AuthenticationService.
 * 
 * Feature: application-layer, Property 10: Authentication Security
 * Validates: Requirements 2.1, 2.4
 */
public class AuthenticationPropertyTest {

    /**
     * Property 10: Valid credentials return success with user info
     */
    @Property(tries = 20)
    void validCredentialsReturnSuccess(
            @ForAll("usernames") String username,
            @ForAll("passwords") String password) {
        // Setup mocks
        UserFacade userFacade = mock(UserFacade.class);
        PasswordHashingService passwordHashingService = mock(PasswordHashingService.class);
        
        UserCredentialsDto creds = new UserCredentialsDto(1L, username, "hashedPassword", SystemRole.EXAMINER, false);
        when(userFacade.findCredentials(username)).thenReturn(Optional.of(creds));
        when(passwordHashingService.matches(password, "hashedPassword")).thenReturn(true);
        
        AuthenticationService authService = new AuthenticationService(userFacade, passwordHashingService);
        
        // Execute
        AuthenticationResult result = authService.authenticate(username, password);
        
        // Verify
        assertThat(result.success()).isTrue();
        assertThat(result.userId()).isEqualTo(1L);
        assertThat(result.username()).isEqualTo(username);
        assertThat(result.role()).isEqualTo(SystemRole.EXAMINER);
        assertThat(result.errorMessage()).isNull();
    }

    /**
     * Property 10: Invalid credentials return failure
     */
    @Property(tries = 20)
    void invalidCredentialsReturnFailure(
            @ForAll("usernames") String username,
            @ForAll("passwords") String password) {
        // Setup mocks
        UserFacade userFacade = mock(UserFacade.class);
        PasswordHashingService passwordHashingService = mock(PasswordHashingService.class);
        
        UserCredentialsDto creds = new UserCredentialsDto(1L, username, "hashedPassword", SystemRole.EXAMINER, false);
        when(userFacade.findCredentials(username)).thenReturn(Optional.of(creds));
        when(passwordHashingService.matches(password, "hashedPassword")).thenReturn(false);
        
        AuthenticationService authService = new AuthenticationService(userFacade, passwordHashingService);
        
        // Execute
        AuthenticationResult result = authService.authenticate(username, password);
        
        // Verify
        assertThat(result.success()).isFalse();
        assertThat(result.userId()).isNull();
        assertThat(result.errorMessage()).isNotNull();
    }

    /**
     * Property 10: Non-existent username returns failure
     */
    @Property(tries = 20)
    void nonExistentUsernameReturnsFailure(
            @ForAll("usernames") String username,
            @ForAll("passwords") String password) {
        // Setup mocks
        UserFacade userFacade = mock(UserFacade.class);
        PasswordHashingService passwordHashingService = mock(PasswordHashingService.class);
        
        when(userFacade.findCredentials(username)).thenReturn(Optional.empty());
        
        AuthenticationService authService = new AuthenticationService(userFacade, passwordHashingService);
        
        // Execute
        AuthenticationResult result = authService.authenticate(username, password);
        
        // Verify
        assertThat(result.success()).isFalse();
        assertThat(result.userId()).isNull();
        assertThat(result.errorMessage()).isNotNull();
    }

    /**
     * Property 10: Error messages do not reveal which credential was incorrect
     * Both wrong username and wrong password should return the same error message
     */
    @Property(tries = 20)
    void errorMessagesAreGeneric(
            @ForAll("usernames") String username,
            @ForAll("passwords") String password) {
        // Setup mocks for wrong username scenario
        UserFacade userFacade1 = mock(UserFacade.class);
        PasswordHashingService passwordHashingService1 = mock(PasswordHashingService.class);
        when(userFacade1.findCredentials(username)).thenReturn(Optional.empty());
        
        AuthenticationService authService1 = new AuthenticationService(userFacade1, passwordHashingService1);
        AuthenticationResult wrongUsernameResult = authService1.authenticate(username, password);
        
        // Setup mocks for wrong password scenario
        UserFacade userFacade2 = mock(UserFacade.class);
        PasswordHashingService passwordHashingService2 = mock(PasswordHashingService.class);
        UserCredentialsDto creds = new UserCredentialsDto(1L, username, "hashedPassword", SystemRole.EXAMINER, false);
        when(userFacade2.findCredentials(username)).thenReturn(Optional.of(creds));
        when(passwordHashingService2.matches(password, "hashedPassword")).thenReturn(false);
        
        AuthenticationService authService2 = new AuthenticationService(userFacade2, passwordHashingService2);
        AuthenticationResult wrongPasswordResult = authService2.authenticate(username, password);
        
        // Both should have the same error message (generic)
        assertThat(wrongUsernameResult.errorMessage())
                .isEqualTo(wrongPasswordResult.errorMessage());
    }

    /**
     * Property 10: Null or blank credentials return failure
     */
    @Property(tries = 5)
    void nullOrBlankCredentialsReturnFailure() {
        UserFacade userFacade = mock(UserFacade.class);
        PasswordHashingService passwordHashingService = mock(PasswordHashingService.class);
        AuthenticationService authService = new AuthenticationService(userFacade, passwordHashingService);
        
        assertThat(authService.authenticate(null, "password").success()).isFalse();
        assertThat(authService.authenticate("username", null).success()).isFalse();
        assertThat(authService.authenticate("", "password").success()).isFalse();
        assertThat(authService.authenticate("username", "").success()).isFalse();
        assertThat(authService.authenticate("   ", "password").success()).isFalse();
    }

    @Provide
    Arbitrary<String> usernames() {
        return Arbitraries.strings()
                .withCharRange('a', 'z')
                .ofMinLength(3)
                .ofMaxLength(20);
    }

    @Provide
    Arbitrary<String> passwords() {
        return Arbitraries.strings()
                .withCharRange('a', 'z')
                .ofMinLength(8)
                .ofMaxLength(30);
    }
}
