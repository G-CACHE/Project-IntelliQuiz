package com.intelliquiz.api.realtime.internal;

import com.intelliquiz.api.realtime.internal.application.services.ProctorSessionService;
import com.intelliquiz.api.realtime.internal.domain.ports.ViolationRecordRepository;
import net.jqwik.api.Example;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class ProctorSessionServicePropertyTest {

    @Example
    void approveReentryClearsKickAndDeviceBlacklistForMappedDevice() {
        ViolationRecordRepository violationRecordRepository = mock(ViolationRecordRepository.class);
        ProctorSessionService service = new ProctorSessionService(violationRecordRepository);

        Long quizId = 101L;
        Long teamId = 202L;
        String deviceId = "device-abc-123";

        service.registerTeamDevice(teamId, deviceId);
        service.kickParticipant(quizId, teamId, "Manual kick");
        service.blacklistDevice(quizId, deviceId);

        assertThat(service.isKicked(quizId, teamId)).isTrue();
        assertThat(service.isDeviceBlacklisted(quizId, deviceId)).isTrue();

        boolean approved = service.approveReentry(quizId, teamId);

        assertThat(approved).isTrue();
        assertThat(service.isKicked(quizId, teamId)).isFalse();
        assertThat(service.isDeviceBlacklisted(quizId, deviceId)).isFalse();
    }

    @Example
    void approveReentryReturnsFalseWhenTeamWasNotKicked() {
        ViolationRecordRepository violationRecordRepository = mock(ViolationRecordRepository.class);
        ProctorSessionService service = new ProctorSessionService(violationRecordRepository);

        boolean approved = service.approveReentry(1L, 2L);

        assertThat(approved).isFalse();
    }
}
