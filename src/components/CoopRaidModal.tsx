import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { TerminalButton } from './TerminalButton';
import { ProgressBar } from './ProgressBar';
import { coopService } from '../services/supabase/coopService';
import {
  ActiveCoopRaid,
  CoopAttack,
  CoopBoss,
  CoopGroup,
  CoopGroupMember,
} from '../types/coop';
import { getQueueStats } from '../services/database/coopQueueRepository';
import { useApp } from '../context/AppContext';
import { RaidTierId } from '../types/raidProgression';

interface CoopRaidModalProps {
  visible: boolean;
  onClose: () => void;
  activeRaid: ActiveCoopRaid | null;
  onSelectActiveRaid: (raid: ActiveCoopRaid | null) => void;
}

export const CoopRaidModal: React.FC<CoopRaidModalProps> = ({
  visible,
  onClose,
  activeRaid,
  onSelectActiveRaid,
}) => {
  const {
    claimCoopRaidVictoryAction,
    isCoopVictoryClaimed,
    syncUserProfileFromCloud,
    checkRaidEligibility,
  } = useApp();

  const isConfigured = coopService.isConfigured();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ displayName: string } | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [callsign, setCallsign] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Squad State
  const [activeTab, setActiveTab] = useState<'squad' | 'boss'>('squad');
  const [mySquads, setMySquads] = useState<CoopGroup[]>([]);
  const [selectedSquad, setSelectedSquad] = useState<CoopGroup | null>(null);
  const [squadMembers, setSquadMembers] = useState<CoopGroupMember[]>([]);
  const [newSquadName, setNewSquadName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // Raid Boss State
  const [currentBoss, setCurrentBoss] = useState<CoopBoss | null>(null);
  const [bossAttacks, setBossAttacks] = useState<CoopAttack[]>([]);

  // Queue State
  const [queueStats, setQueueStats] = useState({ pending: 0, synced: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Refresh Queue Stats
  const refreshQueue = useCallback(() => {
    try {
      setQueueStats(getQueueStats());
    } catch {
      // Ignore if local db not ready
    }
  }, []);

  // Check auth and squads
  const checkAuthAndLoad = useCallback(async () => {
    if (!isConfigured) return;

    try {
      const user = await coopService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const profile = await coopService.getMyProfile();
        setUserProfile(profile);
        if (profile) {
          syncUserProfileFromCloud({
            displayName: profile.displayName,
            factionId: profile.factionId,
          });
        }

        const squads = await coopService.getMySquads();
        setMySquads(squads);

        if (squads.length > 0) {
          const defaultSquad = squads[0];
          setSelectedSquad(defaultSquad);
          const members = await coopService.getSquadMembers(defaultSquad.id);
          setSquadMembers(members);

          const boss = await coopService.getActiveBoss(defaultSquad.id);
          setCurrentBoss(boss);

          if (boss) {
            const attacks = await coopService.getBossAttacks(boss.id, 20);
            setBossAttacks(attacks);
          }
        }
      }
    } catch (err: any) {
      console.warn('Coop auth check error:', err?.message);
    }
  }, [isConfigured]);

  useEffect(() => {
    if (visible) {
      refreshQueue();
      checkAuthAndLoad();
    }
  }, [visible, refreshQueue, checkAuthAndLoad]);

  // Subscribe to Realtime when viewing boss
  useEffect(() => {
    if (!visible || !currentBoss) return;

    const unsubscribe = coopService.subscribeToBoss(
      currentBoss.id,
      (update) => {
        setCurrentBoss((prev) =>
          prev
            ? {
                ...prev,
                currentHp: update.currentHp,
                isDefeated: update.isDefeated,
              }
            : null
        );
      },
      (newAttack) => {
        setBossAttacks((prev) => [newAttack, ...prev.slice(0, 19)]);
      }
    );

    return unsubscribe;
  }, [visible, currentBoss?.id]);

  const handleSignIn = async () => {
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      await coopService.signIn(email.trim(), password);
      await checkAuthAndLoad();
      setStatusMessage('Welcome back, Battle-Brother.');
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed.';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setAuthError(
          'Email not yet confirmed. In Supabase: go to Authentication -> Users and click "Confirm user", or toggle off "Confirm email" in Auth Providers for instant login.'
        );
      } else {
        setAuthError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !callsign) {
      setAuthError('Please fill in callsign, email, and password.');
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await coopService.signUp(email.trim(), password, callsign.trim());
      if (data?.session) {
        await checkAuthAndLoad();
        Alert.alert('Warrior Enlisted', `Welcome to the Crusade, ${callsign}!`);
      } else {
        // Email confirmation is required by Supabase project settings
        Alert.alert(
          'Enlistment Created',
          'Account created! Supabase currently has "Confirm email" enabled by default. To log in immediately without confirmation links, toggle off "Confirm email" in Supabase -> Authentication -> Providers -> Email, or confirm this user under Authentication -> Users.'
        );
        setAuthMode('signin');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to create warrior account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await coopService.signOut();
      setCurrentUser(null);
      setUserProfile(null);
      setMySquads([]);
      setSelectedSquad(null);
      setCurrentBoss(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSquad = async () => {
    if (!newSquadName.trim()) return;
    setIsLoading(true);
    try {
      const created = await coopService.createSquad(newSquadName.trim());
      if (created) {
        setNewSquadName('');
        await checkAuthAndLoad();
        Alert.alert('Squad Created', `Crusade Squad created! Invite code: ${created.inviteCode}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create squad');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSquad = async () => {
    if (!joinCode.trim()) return;
    setIsLoading(true);
    try {
      const joined = await coopService.joinSquadByCode(joinCode.trim());
      if (joined) {
        setJoinCode('');
        await checkAuthAndLoad();
        Alert.alert('Squad Joined', `Enlisted successfully in ${joined.name}!`);
      }
    } catch (err: any) {
      Alert.alert('Invalid Code', err?.message || 'Failed to join squad with code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!selectedSquad) return;
    setIsLoading(true);
    try {
      const newCode = await coopService.regenerateInviteCode(selectedSquad.id);
      setSelectedSquad({ ...selectedSquad, inviteCode: newCode });
      Alert.alert('Code Revoked', `New squad invite code: ${newCode}`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not regenerate invite code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlushPending = async () => {
    setIsLoading(true);
    try {
      const res = await coopService.flushOfflineQueue();
      refreshQueue();
      Alert.alert(
        'Sync Complete',
        `Synced ${res.syncedCount} attacks successfully.${res.errorsCount > 0 ? ` (${res.errorsCount} pending)` : ''}`
      );
    } catch (err: any) {
      Alert.alert('Sync Error', err?.message || 'Failed to flush pending queue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSquadBoss = () => {
    if (!selectedSquad || !currentBoss) return;

    // Co-op Raid Clearance:
    // In cooperative multiplayer squad mode, raid bosses are available from Level 1
    // so recruits can join with friends and assault the shared target together!
    const raid: ActiveCoopRaid = {
      groupId: selectedSquad.id,
      groupName: selectedSquad.name,
      bossId: currentBoss.id,
      bossName: currentBoss.name,
      bossFaction: currentBoss.faction,
      bossLore: currentBoss.loreTitle,
      bossGlyph: currentBoss.glyphName,
      bossMaxHp: currentBoss.maxHp,
      bossCurrentHp: currentBoss.currentHp,
      isDefeated: currentBoss.isDefeated,
      updatedAt: new Date().toISOString(),
    };

    onSelectActiveRaid(raid);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={THEME.colors.textBright} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerSubtitle}>COOPERATIVE CRUSADE</Text>
            <Text style={styles.headerTitle}>SHARED BOSS BATTLES</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Not Configured Banner */}
        {!isConfigured && (
          <View style={styles.bannerNotConfigured}>
            <Ionicons name="warning-outline" size={20} color={THEME.colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>SUPABASE NOT CONFIGURED</Text>
              <Text style={styles.bannerText}>
                To enable live cloud co-op with friends, configure your Supabase URL & Anon Key in .env.
                Workout sets will continue to log and queue locally without interruption!
              </Text>
            </View>
          </View>
        )}

        {/* Offline Queue Quick Action */}
        <View style={styles.queueStatusBar}>
          <View style={styles.queueStatsText}>
            <Ionicons name="cube-outline" size={16} color={THEME.colors.primary} />
            <Text style={styles.queueStatusLabel}>
              Local Offline Buffer: {queueStats.pending} pending / {queueStats.synced} synced
            </Text>
          </View>
          {queueStats.pending > 0 && isConfigured && currentUser && (
            <TouchableOpacity onPress={handleFlushPending} style={styles.syncBtn}>
              <Text style={styles.syncBtnText}>SYNC NOW</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Authentication View if not signed in and configured */}
        {isConfigured && !currentUser && (
          <ScrollView contentContainerStyle={styles.authContainer}>
            <View style={styles.authCard}>
              <View style={styles.authHeader}>
                <Ionicons name="shield-checkmark" size={36} color={THEME.colors.primary} />
                <Text style={styles.authTitle}>CRUSADE NETWORK AUTHENTICATION</Text>
                <Text style={styles.authSubtitle}>
                  Authenticate with Supabase to join squads and battle shared bosses with friends.
                </Text>
              </View>

              {/* Mode Toggle */}
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, authMode === 'signin' && styles.toggleBtnActive]}
                  onPress={() => setAuthMode('signin')}
                >
                  <Text style={[styles.toggleBtnText, authMode === 'signin' && styles.toggleBtnTextActive]}>
                    SIGN IN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, authMode === 'signup' && styles.toggleBtnActive]}
                  onPress={() => setAuthMode('signup')}
                >
                  <Text style={[styles.toggleBtnText, authMode === 'signup' && styles.toggleBtnTextActive]}>
                    CREATE ACCOUNT
                  </Text>
                </TouchableOpacity>
              </View>

              {authError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{authError}</Text>
                </View>
              )}

              {authMode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>WARRIOR CALLSIGN</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Captain Titus"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={callsign}
                    onChangeText={setCallsign}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>COMM-LINK (EMAIL)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="marine@imperium.org"
                  placeholderTextColor={THEME.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CIPHER KEY (PASSWORD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={THEME.colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View style={{ marginTop: 16 }}>
                <TerminalButton
                  title={authMode === 'signin' ? 'ENTER CRUSADE' : 'ENLIST WARRIOR'}
                  onPress={authMode === 'signin' ? handleSignIn : handleSignUp}
                  loading={isLoading}
                />
              </View>
            </View>
          </ScrollView>
        )}

        {/* Authenticated View */}
        {currentUser && (
          <View style={{ flex: 1 }}>
            {/* User Banner */}
            <View style={styles.userBanner}>
              <View style={styles.userCallsignRow}>
                <Ionicons name="radio" size={14} color={THEME.colors.success} />
                <Text style={styles.userCallsignText}>
                  CALLSIGN: {userProfile?.displayName || currentUser.email}
                </Text>
              </View>
              <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
                <Text style={styles.signOutText}>SIGN OUT</Text>
              </TouchableOpacity>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'squad' && styles.tabItemActive]}
                onPress={() => setActiveTab('squad')}
              >
                <Ionicons
                  name="people"
                  size={16}
                  color={activeTab === 'squad' ? THEME.colors.primary : THEME.colors.textMuted}
                />
                <Text style={[styles.tabItemText, activeTab === 'squad' && styles.tabItemTextActive]}>
                  SQUAD BARRACKS
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'boss' && styles.tabItemActive]}
                onPress={() => setActiveTab('boss')}
              >
                <Ionicons
                  name="skull"
                  size={16}
                  color={activeTab === 'boss' ? '#FF4757' : THEME.colors.textMuted}
                />
                <Text style={[styles.tabItemText, activeTab === 'boss' && { color: '#FF4757' }]}>
                  RAID ENCOUNTER
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView contentContainerStyle={styles.contentScroll}>
              {activeTab === 'squad' && (
                <View>
                  {/* Current Squad Info */}
                  {selectedSquad ? (
                    <View style={styles.sectionCard}>
                      <View style={styles.cardHeaderRow}>
                        <View>
                          <Text style={styles.cardSuperTitle}>ACTIVE SQUAD</Text>
                          <Text style={styles.cardMainTitle}>{selectedSquad.name}</Text>
                        </View>
                        <View style={styles.activePill}>
                          <Text style={styles.activePillText}>READY</Text>
                        </View>
                      </View>

                      {/* Invite Code Box */}
                      <View style={styles.inviteBox}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inviteLabel}>RECRUITMENT CIPHER (INVITE CODE)</Text>
                          <Text style={styles.inviteCodeText}>{selectedSquad.inviteCode}</Text>
                          <Text style={styles.inviteHelp}>
                            Give this 8-digit code to friends so their workouts damage this shared boss.
                          </Text>
                        </View>
                        {selectedSquad.createdBy === currentUser.id && (
                          <TouchableOpacity
                            onPress={handleRegenerateCode}
                            style={styles.revokeBtn}
                            disabled={isLoading}
                          >
                            <Ionicons name="refresh" size={16} color={THEME.colors.danger} />
                            <Text style={styles.revokeBtnText}>REVOKE</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Members List */}
                      <Text style={styles.memberSectionTitle}>
                        CRUSADE BATTLE-BROTHERS ({squadMembers.length})
                      </Text>
                      {squadMembers.map((member) => (
                        <View key={member.userId} style={styles.memberRow}>
                          <Ionicons
                            name={(member.profile?.avatarGlyph as any) || 'shield-outline'}
                            size={18}
                            color={THEME.colors.primary}
                          />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.memberName}>
                              {member.profile?.displayName || 'Warrior'}
                            </Text>
                            <Text style={styles.memberFaction}>
                              {member.role.toUpperCase()} • ENLISTED
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptySquadCard}>
                      <Text style={styles.emptyTitle}>NO CRUSADE SQUAD JOINED</Text>
                      <Text style={styles.emptySubtitle}>
                        Create a squad to invite your friends, or enter an invite code to join one.
                      </Text>
                    </View>
                  )}

                  {/* Join Squad by Code */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.cardMainTitle}>ENLIST VIA INVITE CIPHER</Text>
                    <View style={styles.inlineActionRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, textTransform: 'uppercase' }]}
                        placeholder="ENTER 8-CHAR CODE"
                        placeholderTextColor={THEME.colors.textMuted}
                        value={joinCode}
                        onChangeText={setJoinCode}
                        maxLength={8}
                      />
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={handleJoinSquad}
                        disabled={isLoading}
                      >
                        <Text style={styles.actionBtnText}>JOIN</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Create New Squad */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.cardMainTitle}>FOUND NEW CRUSADE SQUAD</Text>
                    <View style={styles.inlineActionRow}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Squad Name (e.g. Ultramar Vanguard)"
                        placeholderTextColor={THEME.colors.textMuted}
                        value={newSquadName}
                        onChangeText={setNewSquadName}
                      />
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={handleCreateSquad}
                        disabled={isLoading}
                      >
                        <Text style={styles.actionBtnText}>CREATE</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {activeTab === 'boss' && (
                <View>
                  {currentBoss ? (
                    <View style={styles.sectionCard}>
                      <View style={styles.cardHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cardSuperTitle, { color: '#FF4757' }]}>
                            {currentBoss.faction.toUpperCase()} RAID TARGET
                          </Text>
                          <Text style={styles.bossBigTitle}>{currentBoss.name}</Text>
                          <Text style={styles.bossLoreText}>{currentBoss.loreTitle}</Text>
                        </View>
                        <View style={styles.bossAvatarBig}>
                          <Ionicons
                            name={(currentBoss.glyphName as any) || 'skull'}
                            size={32}
                            color={currentBoss.isDefeated ? THEME.colors.success : '#FF3838'}
                          />
                        </View>
                      </View>

                      {/* Boss HP */}
                      <View style={{ marginVertical: 12 }}>
                        <View style={styles.hpLabelRow}>
                          <Text style={styles.hpLabel}>RAID HEALTH</Text>
                          <Text style={styles.hpNumber}>
                            {currentBoss.isDefeated
                              ? 'SLAIN'
                              : `${currentBoss.currentHp.toLocaleString()} / ${currentBoss.maxHp.toLocaleString()} HP`}
                          </Text>
                        </View>
                        <ProgressBar
                          progress={currentBoss.maxHp > 0 ? currentBoss.currentHp / currentBoss.maxHp : 0}
                          color={currentBoss.isDefeated ? THEME.colors.success : '#FF3838'}
                          height={12}
                        />
                      </View>

                      {/* Target Select / Victory Claim Action */}
                      {currentBoss.isDefeated ? (
                        isCoopVictoryClaimed(currentBoss.id) ? (
                          <TerminalButton
                            title="BATTLE HONOR RECORDED // SPOILS SECURED"
                            onPress={() => {}}
                            variant="secondary"
                            size="md"
                            disabled
                            icon={
                              <Ionicons
                                name="checkmark-done-circle-outline"
                                size={18}
                                color={THEME.colors.primary}
                              />
                            }
                            style={{ marginTop: 8 }}
                          />
                        ) : (
                          <TerminalButton
                            title="CLAIM CRUSADE SPOILS & RECORD BATTLE HONOR"
                            onPress={() => {
                              const success = claimCoopRaidVictoryAction(
                                currentBoss,
                                selectedSquad || undefined,
                                bossAttacks
                              );
                              if (success) {
                                Alert.alert(
                                  'CRUSADE VICTORY RECORDED',
                                  `Glorious victory! ${currentBoss.name} has been permanently inscribed in your Crusade Battle History, and ${
                                    currentBoss.gloryXp || 500
                                  } Glory XP has been awarded to your character.`
                                );
                              }
                            }}
                            variant="primary"
                            size="md"
                            icon={<Ionicons name="trophy-outline" size={18} color="#0A0E17" />}
                            style={{ marginTop: 8 }}
                          />
                        )
                      ) : (
                        <View style={{ gap: 6, marginTop: 8 }}>
                          <View style={styles.coopUnlockedNotice}>
                            <Ionicons name="shield-checkmark" size={13} color="#00E676" />
                            <Text style={styles.coopUnlockedNoticeText}>
                              Co-op Deployment: All squad operatives cleared from Level 1
                            </Text>
                          </View>
                          <TerminalButton
                            title={
                              activeRaid?.bossId === currentBoss.id
                                ? 'TARGET ENGAGED FOR WORKOUTS'
                                : 'ENGAGE IN WORKOUTS (CO-OP)'
                            }
                            onPress={handleSelectSquadBoss}
                          />
                        </View>
                      )}

                      {/* Privacy Note */}
                      <View style={styles.privacyNoteBox}>
                        <Ionicons name="lock-closed-outline" size={14} color={THEME.colors.textMuted} />
                        <Text style={styles.privacyNoteText}>
                          Privacy Notice: Only attack names and damage totals are broadcast to friends.
                          Your raw workout reps and weights remain 100% private on your device.
                        </Text>
                      </View>

                      {/* Realtime Strikes Feed */}
                      <Text style={[styles.memberSectionTitle, { marginTop: 16 }]}>
                        RECENT SQUAD STRIKES (LIVE)
                      </Text>
                      {bossAttacks.length === 0 ? (
                        <Text style={styles.noStrikesText}>
                          No strikes recorded yet. Complete workout sets to assault this boss!
                        </Text>
                      ) : (
                        bossAttacks.map((atk) => (
                          <View key={atk.id} style={styles.attackRow}>
                            <Ionicons name="flash-outline" size={16} color={THEME.colors.warning} />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                              <Text style={styles.attackUser}>
                                {atk.userName} • <Text style={{ color: '#FFB800' }}>-{atk.damage} DMG</Text>
                              </Text>
                              <Text style={styles.attackDetail}>
                                {atk.attackName} ({atk.styleName}) via {atk.exerciseName}
                              </Text>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  ) : (
                    <View style={styles.emptySquadCard}>
                      <Text style={styles.emptyTitle}>NO ACTIVE BOSS FOUND</Text>
                      <Text style={styles.emptySubtitle}>
                        Select or create a Crusade Squad to activate a cooperative raid target.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  closeBtn: {
    padding: 6,
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    color: THEME.colors.primary,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    color: THEME.colors.textBright,
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },
  bannerNotConfigured: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.4)',
    margin: 12,
    padding: 12,
    borderRadius: 6,
    gap: 10,
  },
  bannerTitle: {
    fontSize: 12,
    color: THEME.colors.warning,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bannerText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  queueStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0F1522',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 240, 255, 0.15)',
  },
  queueStatsText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  queueStatusLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  syncBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  syncBtnText: {
    fontSize: 10,
    color: THEME.colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  authContainer: {
    padding: 16,
  },
  authCard: {
    backgroundColor: '#0F1522',
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.textBright,
    letterSpacing: 1.5,
    marginTop: 8,
  },
  authSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#172033',
    borderRadius: 6,
    padding: 2,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 4,
  },
  toggleBtnActive: {
    backgroundColor: THEME.colors.primary,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  toggleBtnTextActive: {
    color: '#080C14',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    borderWidth: 1,
    borderColor: THEME.colors.danger,
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 11,
    color: THEME.colors.danger,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#172033',
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: THEME.colors.textBright,
    fontSize: 13,
  },
  userBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#121927',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  userCallsignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userCallsignText: {
    fontSize: 11,
    color: THEME.colors.success,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  signOutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  signOutText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: THEME.colors.primary,
  },
  tabItemText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tabItemTextActive: {
    color: THEME.colors.primary,
  },
  contentScroll: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#0F1522',
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardSuperTitle: {
    fontSize: 9,
    color: THEME.colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  cardMainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textBright,
  },
  activePill: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderWidth: 1,
    borderColor: THEME.colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    fontSize: 10,
    color: THEME.colors.success,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  inviteBox: {
    flexDirection: 'row',
    backgroundColor: '#172033',
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  inviteLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  inviteCodeText: {
    fontSize: 18,
    color: '#00F0FF',
    fontWeight: 'bold',
    letterSpacing: 3,
    marginVertical: 2,
  },
  inviteHelp: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  revokeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.4)',
    marginLeft: 8,
  },
  revokeBtnText: {
    fontSize: 9,
    color: THEME.colors.danger,
    fontWeight: 'bold',
    marginTop: 2,
  },
  memberSectionTitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  memberName: {
    fontSize: 13,
    color: THEME.colors.textBright,
    fontWeight: '600',
  },
  memberFaction: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  emptySquadCard: {
    backgroundColor: '#0F1522',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.textBright,
    letterSpacing: 1,
  },
  emptySubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  inlineActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#080C14',
    letterSpacing: 1,
  },
  bossBigTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textBright,
  },
  bossLoreText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  bossAvatarBig: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#172033',
    borderWidth: 1.5,
    borderColor: '#FF3838',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  hpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  hpLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  hpNumber: {
    fontSize: 11,
    color: THEME.colors.textBright,
    fontWeight: 'bold',
  },
  privacyNoteBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 4,
    marginVertical: 10,
    alignItems: 'center',
  },
  privacyNoteText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    flex: 1,
  },
  noStrikesText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  attackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  attackUser: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.textBright,
  },
  attackDetail: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  coopLockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.35)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  coopLockedNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#FF8A80',
    fontWeight: '600',
  },
  coopUnlockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  coopUnlockedNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#00E676',
    fontWeight: '600',
  },
});
