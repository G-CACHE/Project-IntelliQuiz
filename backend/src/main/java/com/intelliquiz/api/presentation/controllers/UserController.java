package com.intelliquiz.api.presentation.controllers;

import com.intelliquiz.api.application.commands.CreateUserCommand;
import com.intelliquiz.api.application.commands.UpdateUserCommand;
import com.intelliquiz.api.application.services.UserManagementService;
import com.intelliquiz.api.domain.entities.User;
import com.intelliquiz.api.presentation.dto.request.AssignPermissionsRequest;
import com.intelliquiz.api.presentation.dto.request.CreateUserRequest;
import com.intelliquiz.api.presentation.dto.request.UpdateUserRequest;
import com.intelliquiz.api.presentation.dto.response.ErrorResponse;
import com.intelliquiz.api.presentation.dto.response.QuizAssignmentResponse;
import com.intelliquiz.api.presentation.dto.response.UserResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for user management.
 * Requires SUPER_ADMIN role for all operations.
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Admin user management. Requires SUPER_ADMIN role for all operations.")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserManagementService userManagementService;

    public UserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    /**
     * Gets all users.
     */
    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Get all users",
            description = "Retrieves all admin users. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Users retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserResponse[].class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - SUPER_ADMIN role required",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<java.util.List<UserResponse>> getAllUsers() {
        java.util.List<UserResponse> users = userManagementService.getAllAdmins().stream()
                .map(UserResponse::from)
                .toList();
        return ResponseEntity.ok(users);
    }

    /**
     * Gets the current user's info (role and username).
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(
            summary = "Get current user info",
            description = "Retrieves the authenticated user's info including role. Requires ADMIN or SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "User info retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<UserResponse> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        User user = userManagementService.getAdminByUsername(username);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    /**
     * Gets the current user's quiz assignments.
     */
    @GetMapping("/me/assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(
            summary = "Get my quiz assignments",
            description = "Retrieves the authenticated user's quiz assignments. Requires ADMIN or SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Assignments retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuizAssignmentResponse[].class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - ADMIN or SUPER_ADMIN role required",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<java.util.List<QuizAssignmentResponse>> getMyAssignments() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        User user = userManagementService.getAdminByUsername(username);
        java.util.List<QuizAssignmentResponse> assignments = userManagementService
                .getUserAssignments(user.getId())
                .stream()
                .map(QuizAssignmentResponse::from)
                .toList();
        return ResponseEntity.ok(assignments);
    }

    /**
     * Gets a user by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Get user by ID",
            description = "Retrieves a specific user by their ID. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "User retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - SUPER_ADMIN role required",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<UserResponse> getUserById(
            @Parameter(description = "Unique identifier of the user", required = true)
            @PathVariable Long id) {
        User user = userManagementService.getAdmin(id);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    /**
     * Creates a new admin user.
     */
    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Create admin user",
            description = "Creates a new admin user with the specified role. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "User created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request body",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - SUPER_ADMIN role required",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        CreateUserCommand command = new CreateUserCommand(
                request.username(),
                request.password(),
                request.role()
        );
        User user = userManagementService.createAdmin(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    /**
     * Updates an existing user.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Update user",
            description = "Updates an existing user's username and/or password. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "User updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request body",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - SUPER_ADMIN role required",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<UserResponse> updateUser(
            @Parameter(description = "Unique identifier of the user", required = true)
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UpdateUserCommand command = new UpdateUserCommand(
                request.username(),
                request.password()
        );
        User user = userManagementService.updateAdmin(id, command);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    /**
     * Deletes a user.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Delete user",
            description = "Deletes a user and all associated quiz assignments. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "User deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - SUPER_ADMIN role required",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<Void> deleteUser(
            @Parameter(description = "Unique identifier of the user", required = true)
            @PathVariable Long id) {
        userManagementService.deleteAdmin(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Assigns quiz permissions to a user.
     */
    @PostMapping("/{userId}/permissions")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Assign quiz permissions",
            description = "Assigns specific quiz permissions to a user. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Permissions assigned successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request body",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - SUPER_ADMIN role required",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User or quiz not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<Void> assignPermissions(
            @Parameter(description = "Unique identifier of the user", required = true)
            @PathVariable Long userId,
            @Valid @RequestBody AssignPermissionsRequest request) {
        userManagementService.assignQuizPermissions(userId, request.quizId(), request.permissions());
        return ResponseEntity.ok().build();
    }

    /**
     * Revokes quiz access from a user.
     */
    @DeleteMapping("/{userId}/permissions/{quizId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Revoke quiz access",
            description = "Revokes a user's access to a specific quiz. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Access revoked successfully"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - SUPER_ADMIN role required",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User or quiz not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<Void> revokeAccess(
            @Parameter(description = "Unique identifier of the user", required = true)
            @PathVariable Long userId,
            @Parameter(description = "Unique identifier of the quiz", required = true)
            @PathVariable Long quizId) {
        userManagementService.revokeQuizAccess(userId, quizId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Gets all quiz assignments for a user.
     */
    @GetMapping("/{userId}/assignments")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Get user assignments",
            description = "Retrieves all quiz assignments for a specific user. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Assignments retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = QuizAssignmentResponse[].class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - SUPER_ADMIN role required",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "User not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<java.util.List<QuizAssignmentResponse>> getUserAssignments(
            @Parameter(description = "Unique identifier of the user", required = true)
            @PathVariable Long userId) {
        java.util.List<QuizAssignmentResponse> assignments = userManagementService.getUserAssignments(userId).stream()
                .map(QuizAssignmentResponse::from)
                .toList();
        return ResponseEntity.ok(assignments);
    }
}
