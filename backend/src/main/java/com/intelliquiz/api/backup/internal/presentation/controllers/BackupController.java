package com.intelliquiz.api.backup.internal.presentation.controllers;

import com.intelliquiz.api.backup.internal.application.services.BackupService;
import com.intelliquiz.api.backup.internal.domain.entities.BackupRecord;
import com.intelliquiz.api.user.UserFacade;
import com.intelliquiz.api.user.dto.UserInfoDto;
import com.intelliquiz.api.shared.enums.SystemRole;
import com.intelliquiz.api.shared.exceptions.AuthorizationException;
import com.intelliquiz.api.shared.exceptions.BackupNotFoundException;
import com.intelliquiz.api.shared.security.SecurityUtils;
import com.intelliquiz.api.backup.internal.presentation.dto.BackupRecordDTO;
import com.intelliquiz.api.shared.dto.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for database backup and recovery operations.
 * All endpoints require SUPER_ADMIN role.
 */
@RestController
@RequestMapping("/api/backups")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Database Backup", description = "Database backup and recovery operations (Super Admin only)")
@SecurityRequirement(name = "bearerAuth")
public class BackupController {

    private final BackupService backupService;
    private final UserFacade userFacade;

    public BackupController(BackupService backupService, UserFacade userFacade) {
        this.backupService = backupService;
        this.userFacade = userFacade;
    }

    /**
     * Creates a new database backup.
     */
    @PostMapping
    @Operation(
            summary = "Create database backup",
            description = "Creates a new PostgreSQL database backup. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Backup created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = BackupRecordDTO.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User is not a super admin",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Backup operation failed",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<BackupRecordDTO> createBackup() {
        UserInfoDto user = requireSuperAdmin();
        BackupRecord record = backupService.createBackup(user.id());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BackupRecordDTO.fromEntity(record, user.username()));
    }

    /**
     * Lists all database backups.
     */
    @GetMapping
    @Operation(
            summary = "List all backups",
            description = "Retrieves a list of all database backups ordered by creation time (newest first). Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Backups retrieved successfully",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = BackupRecordDTO.class)))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User is not a super admin",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<List<BackupRecordDTO>> listBackups() {
        requireSuperAdmin();
        List<BackupRecord> records = backupService.listBackups();
        List<BackupRecordDTO> dtos = records.stream()
                .map(r -> BackupRecordDTO.fromEntity(r, resolveUsername(r.getCreatedByUserId())))
                .toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Gets a specific backup by ID.
     */
    @GetMapping("/{id}")
    @Operation(
            summary = "Get backup details",
            description = "Retrieves details of a specific backup by ID. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Backup retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = BackupRecordDTO.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User is not a super admin",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Backup not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<BackupRecordDTO> getBackup(
            @Parameter(description = "Unique identifier of the backup", required = true)
            @PathVariable Long id) {
        requireSuperAdmin();
        BackupRecord record = backupService.getBackup(id)
                .orElseThrow(() -> new BackupNotFoundException(id));
        return ResponseEntity.ok(BackupRecordDTO.fromEntity(record, resolveUsername(record.getCreatedByUserId())));
    }

    /**
     * Downloads a backup file.
     */
    @GetMapping("/{id}/download")
    @Operation(
            summary = "Download backup file",
            description = "Downloads the backup file for the specified backup ID. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Backup file downloaded successfully",
                    content = @Content(mediaType = "application/octet-stream")
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User is not a super admin",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Backup or backup file not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<Resource> downloadBackup(
            @Parameter(description = "Unique identifier of the backup", required = true)
            @PathVariable Long id) {
        requireSuperAdmin();
        BackupRecord record = backupService.getBackup(id)
                .orElseThrow(() -> new BackupNotFoundException(id));
        Resource resource = backupService.downloadBackup(id);
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + record.getFilename() + "\"")
                .body(resource);
    }

    /**
     * Restores the database from a backup.
     */
    @PostMapping("/{id}/restore")
    @Operation(
            summary = "Restore database from backup",
            description = "Restores the database from the specified backup. A pre-restore backup is created automatically. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Database restored successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = BackupRecordDTO.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User is not a super admin",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Backup or backup file not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Restore operation failed",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<BackupRecordDTO> restoreBackup(
            @Parameter(description = "Unique identifier of the backup to restore from", required = true)
            @PathVariable Long id) {
        UserInfoDto user = requireSuperAdmin();
        BackupRecord record = backupService.restoreFromBackup(id, user.id());
        return ResponseEntity.ok(BackupRecordDTO.fromEntity(record, resolveUsername(record.getCreatedByUserId())));
    }

    /**
     * Deletes a backup.
     */
    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete backup",
            description = "Deletes a backup record and its associated file. Requires SUPER_ADMIN role."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Backup deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT token missing or invalid",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - User is not a super admin",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Backup not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<Void> deleteBackup(
            @Parameter(description = "Unique identifier of the backup to delete", required = true)
            @PathVariable Long id) {
        requireSuperAdmin();
        backupService.deleteBackup(id);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private UserInfoDto requireSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserInfoDto user = userFacade.getUserByUsername(auth.getName());
        if (user.role() != SystemRole.SUPER_ADMIN) {
            throw new AuthorizationException("This operation requires super admin privileges");
        }
        return user;
    }

    private String resolveUsername(Long userId) {
        if (userId == null) return null;
        try {
            return userFacade.getUserById(userId).username();
        } catch (Exception e) {
            return null;
        }
    }
}
