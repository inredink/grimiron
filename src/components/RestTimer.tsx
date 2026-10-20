import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';
import { TerminalButton } from './TerminalButton';
import { triggerHaptic } from '../utils/haptics';

interface RestTimerProps {
  initialSeconds?: number;
  autoStart?: boolean;
  onTimerComplete?: () => void;
  visible?: boolean;
  onClose?: () => void;
}

export const PRESET_TIMES = [30, 60, 90, 120, 180];

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds = 90,
  autoStart = true,
  onTimerComplete,
  visible = true,
  onClose,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            triggerHaptic.warning();
            onTimerComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, secondsRemaining, onTimerComplete]);

  const startTimer = (seconds: number) => {
    setTotalSeconds(seconds);
    setSecondsRemaining(seconds);
    setIsRunning(true);
  };

  const addTime = (additionalSeconds: number) => {
    setTotalSeconds((prev) => prev + additionalSeconds);
    setSecondsRemaining((prev) => prev + additionalSeconds);
    setIsRunning(true);
  };

  const togglePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setSecondsRemaining(totalSeconds);
    setIsRunning(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const progressPercent = totalSeconds > 0
    ? Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100)
    : 100;

  if (!visible) return null;

  return (
    <>
      {/* Mini Floating HUD Banner */}
      <View style={styles.hudContainer}>
        <TouchableOpacity
          style={styles.hudContent}
          activeOpacity={0.8}
          onPress={() => setIsModalOpen(true)}
        >
          <View style={styles.hudLeft}>
            <Ionicons
              name={secondsRemaining === 0 ? 'checkmark-circle' : 'hourglass-outline'}
              size={18}
              color={secondsRemaining === 0 ? THEME.colors.success : THEME.colors.secondary}
            />
            <View style={styles.hudTextGroup}>
              <Text style={styles.hudLabel}>
                {secondsRemaining === 0 ? 'REST COMPLETE' : 'REST PROTOCOL'}
              </Text>
              <Text
                style={[
                  styles.hudTime,
                  secondsRemaining === 0 && styles.hudTimeComplete,
                ]}
              >
                {formatTime(secondsRemaining)}
              </Text>
            </View>
          </View>

          <View style={styles.hudCenterProgress}>
            <ProgressBar
              progress={progressPercent}
              color={secondsRemaining === 0 ? THEME.colors.success : THEME.colors.secondary}
              height={4}
            />
          </View>
        </TouchableOpacity>

        {/* Quick Controls */}
        <View style={styles.hudControls}>
          <TouchableOpacity
            style={styles.hudButton}
            onPress={togglePlayPause}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={16}
              color={THEME.colors.textBright}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hudButton}
            onPress={() => addTime(30)}
            activeOpacity={0.7}
          >
            <Text style={styles.hudAddText}>+30s</Text>
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity
              style={styles.hudButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={16} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Expanded Modal View for Customization */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CHRONO // REST TIMER</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.digitalDisplay}>
              <Text
                style={[
                  styles.digitalTime,
                  secondsRemaining === 0 && { color: THEME.colors.success },
                ]}
              >
                {formatTime(secondsRemaining)}
              </Text>
              <Text style={styles.digitalStatus}>
                {secondsRemaining === 0
                  ? 'RECOVERY CYCLE FINISHED // COMMENCE NEXT SET'
                  : isRunning
                  ? 'RECOVERY CYCLE ACTIVE'
                  : 'PROTOCOL PAUSED'}
              </Text>
            </View>

            <ProgressBar
              progress={progressPercent}
              color={secondsRemaining === 0 ? THEME.colors.success : THEME.colors.secondary}
              height={8}
              style={{ marginVertical: 12 }}
            />

            {/* Quick Presets */}
            <Text style={styles.presetsLabel}>SET DURATION</Text>
            <View style={styles.presetsRow}>
              {PRESET_TIMES.map((secs) => (
                <TouchableOpacity
                  key={secs}
                  style={[
                    styles.presetPill,
                    totalSeconds === secs && styles.presetPillActive,
                  ]}
                  onPress={() => startTimer(secs)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetText,
                      totalSeconds === secs && styles.presetTextActive,
                    ]}
                  >
                    {secs < 60 ? `${secs}s` : `${secs / 60}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TerminalButton
                title={isRunning ? 'PAUSE' : 'RESUME'}
                onPress={togglePlayPause}
                variant={isRunning ? 'ghost' : 'secondary'}
                size="md"
                style={{ flex: 1, marginRight: 8 }}
              />
              <TerminalButton
                title="+30 SEC"
                onPress={() => addTime(30)}
                variant="outline"
                size="md"
                style={{ flex: 1, marginRight: 8 }}
              />
              <TerminalButton
                title="RESET"
                onPress={resetTimer}
                variant="ghost"
                size="md"
                style={{ width: 70 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  hudContainer: {
    backgroundColor: '#0E1724',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.secondaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudTextGroup: {
    marginLeft: 8,
  },
  hudLabel: {
    color: THEME.colors.secondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  hudTime: {
    color: THEME.colors.textBright,
    fontSize: 15,
    fontWeight: '900',
  },
  hudTimeComplete: {
    color: THEME.colors.success,
  },
  hudCenterProgress: {
    flex: 1,
    marginHorizontal: 12,
  },
  hudControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudButton: {
    padding: 6,
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudAddText: {
    color: THEME.colors.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 2,
    borderColor: THEME.colors.secondary,
    padding: THEME.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  modalTitle: {
    color: THEME.colors.secondary,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  digitalDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  digitalTime: {
    color: THEME.colors.secondary,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
  },
  digitalStatus: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  presetsLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: THEME.colors.surfaceRaised,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  presetPillActive: {
    backgroundColor: THEME.colors.secondary,
    borderColor: THEME.colors.secondary,
  },
  presetText: {
    color: THEME.colors.textBright,
    fontSize: 12,
    fontWeight: '700',
  },
  presetTextActive: {
    color: '#0A0E17',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
});
