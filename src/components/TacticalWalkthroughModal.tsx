import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../utils/haptics';

interface TacticalWalkthroughModalProps {
  visible: boolean;
  onClose: () => void;
  currentCallsign: string;
  onSaveCallsign: (newCallsign: string) => void;
  onCompleteOnboarding: () => void;
  onOpenCloudAuth?: () => void;
  isCloudAuthenticated?: boolean;
  cloudEmail?: string;
  onSignUpCloud?: (email: string, pass: string, callsign: string) => Promise<{ success: boolean; message: string }>;
  onSignInCloud?: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  onResendVerification?: (email: string) => Promise<{ success: boolean; message: string }>;
}

interface WalkthroughSlide {
  id: string;
  badge: string;
  badgeColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
}

const SLIDES: WalkthroughSlide[] = [
  {
    id: 'intro',
    badge: 'PROTOCOL INITIALIZATION',
    badgeColor: '#00F0FF',
    icon: 'shield-checkmark',
    iconColor: '#00F0FF',
    title: 'WELCOME, INITIATE',
    subtitle: 'Tactical Directive & Combat Architecture',
  },
  {
    id: 'local_account',
    badge: 'LOCAL-FIRST ARCHITECTURE',
    badgeColor: '#00E676',
    icon: 'hardware-chip-outline',
    iconColor: '#00E676',
    title: 'HOW ACCOUNTS WORK',
    subtitle: 'A. Local Account (Default — 100% Offline)',
  },
  {
    id: 'cloud_account',
    badge: 'CRUSADE CLOUD & SYNC',
    badgeColor: '#FFB800',
    icon: 'cloud-done-outline',
    iconColor: '#FFB800',
    title: 'MULTIPLAYER RAIDS',
    subtitle: 'B. Cloud Account (Optional — for Co-op)',
  },
  {
    id: 'factions',
    badge: '20 40K FACTIONS',
    badgeColor: '#FF3366',
    icon: 'skull-outline',
    iconColor: '#FF3366',
    title: 'FACTIONS & ARMORY',
    subtitle: 'Loyalty Ranks & Custom Subfaction Forge',
  },
  {
    id: 'combat',
    badge: 'STEEL INTO GLORY',
    badgeColor: '#FF9100',
    icon: 'flame-outline',
    iconColor: '#FF9100',
    title: 'COMBAT & PROGRESSION',
    subtitle: 'Workouts, Boss Hunts & 379 Achievements',
  },
];

export const TacticalWalkthroughModal: React.FC<TacticalWalkthroughModalProps> = ({
  visible,
  onClose,
  currentCallsign,
  onSaveCallsign,
  onCompleteOnboarding,
  onOpenCloudAuth,
  isCloudAuthenticated = false,
  cloudEmail,
  onSignUpCloud,
  onSignInCloud,
  onResendVerification,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [callsignInput, setCallsignInput] = useState(currentCallsign || 'Battle-Brother');

  // Inline Cloud Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCallsign, setAuthCallsign] = useState(currentCallsign || 'Battle-Brother');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const currentSlide = SLIDES[currentSlideIndex];
  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex === SLIDES.length - 1;

  const handleNext = () => {
    triggerHaptic.selection();
    if (isLastSlide) {
      handleFinish();
    } else {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    triggerHaptic.selection();
    if (!isFirstSlide) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    triggerHaptic.success();
    if (callsignInput.trim() && callsignInput.trim() !== currentCallsign) {
      onSaveCallsign(callsignInput.trim());
    }
    onCompleteOnboarding();
    onClose();
  };

  const handleSkip = () => {
    triggerHaptic.medium();
    handleFinish();
  };

  const handleOpenAuthModal = (mode: 'signup' | 'signin') => {
    triggerHaptic.selection();
    setAuthMode(mode);
    setAuthEmail('');
    setAuthPassword('');
    setAuthCallsign(callsignInput.trim() || 'Battle-Brother');
    setAuthError(null);
    setShowAuthModal(true);
  };

  const handleAuthSubmit = async () => {
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter both email and password.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    if (authMode === 'signup' && !authCallsign.trim()) {
      setAuthError('Please provide a tactical callsign.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'signup' && onSignUpCloud) {
        const res = await onSignUpCloud(authEmail.trim(), authPassword, authCallsign.trim());
        if (res.success) {
          setShowAuthModal(false);
          setCallsignInput(authCallsign.trim());
          triggerHaptic.success();
          Alert.alert(
            'Crusader Account Registered!',
            `${res.message}\n\nA confirmation transmission has been dispatched to ${authEmail.trim()}.\n\nCheck your Inbox and Spam/Junk folder. You can continue the directive walkthrough now.`
          );
        } else {
          setAuthError(res.message);
          triggerHaptic.warning();
        }
      } else if (authMode === 'signin' && onSignInCloud) {
        const res = await onSignInCloud(authEmail.trim(), authPassword);
        if (res.success) {
          setShowAuthModal(false);
          triggerHaptic.success();
          Alert.alert('Session Authenticated', res.message);
        } else {
          setAuthError(res.message);
          triggerHaptic.warning();
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error.');
      triggerHaptic.warning();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!cloudEmail || !onResendVerification) return;
    triggerHaptic.selection();
    const res = await onResendVerification(cloudEmail);
    if (res.success) {
      triggerHaptic.success();
      Alert.alert('Verification Transmission', res.message);
    } else {
      triggerHaptic.warning();
      Alert.alert('Notice', res.message);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleFinish}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerBadgeRow}>
              <View style={[styles.headerPill, { backgroundColor: `${currentSlide.badgeColor}20` }]}>
                <Ionicons name="terminal-outline" size={13} color={currentSlide.badgeColor} />
                <Text style={[styles.headerPillText, { color: currentSlide.badgeColor }]}>
                  {currentSlide.badge}
                </Text>
              </View>
              <Text style={styles.slideCounterText}>
                DIRECTIVE {currentSlideIndex + 1} / {SLIDES.length}
              </Text>
            </View>

            <TouchableOpacity onPress={handleSkip} style={styles.skipButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.skipButtonText}>SKIP DIRECTIVE</Text>
              <Ionicons name="close" size={16} color="#78909C" />
            </TouchableOpacity>
          </View>

          {/* Slide Content Scroll */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Slide Hero Graphic & Title */}
            <View style={styles.heroSection}>
              <View style={[styles.iconRing, { borderColor: `${currentSlide.iconColor}40`, backgroundColor: `${currentSlide.iconColor}15` }]}>
                <Ionicons name={currentSlide.icon} size={36} color={currentSlide.iconColor} />
              </View>
              <Text style={styles.slideTitle}>{currentSlide.title}</Text>
              <Text style={styles.slideSubtitle}>{currentSlide.subtitle}</Text>
            </View>

            {/* SLIDE 1: INTRO */}
            {currentSlide.id === 'intro' && (
              <View style={styles.bodySection}>
                <View style={styles.featureBox}>
                  <View style={styles.featureRow}>
                    <Ionicons name="barbell-outline" size={20} color="#00F0FF" />
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>PHYSICAL TRAINING MEETS 40K COMBAT</Text>
                      <Text style={styles.featureDesc}>
                        GrimIron converts every real set, rep, and kilogram of weight moved into transhuman combat damage, XP, and campaign progress.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.featureBox}>
                  <View style={styles.featureRow}>
                    <Ionicons name="shield-outline" size={20} color="#FFB800" />
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>PURPOSE-BUILT FOR ATHLETES</Text>
                      <Text style={styles.featureDesc}>
                        Engineered for barbells, dumbbells, bodyweight calisthenics, rest timers, screen wake locks, and serious strength development.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.featureBox}>
                  <View style={styles.featureRow}>
                    <Ionicons name="trophy-outline" size={20} color="#00E676" />
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>PROGRESSION THAT LASTS YEARS</Text>
                      <Text style={styles.featureDesc}>
                        379 tiered achievements and 100 level ranks ranging from initiate scouting missions to multi-year relic milestones.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* SLIDE 2: LOCAL ACCOUNT ARCHITECTURE */}
            {currentSlide.id === 'local_account' && (
              <View style={styles.bodySection}>
                <View style={styles.architectureCard}>
                  <View style={styles.archHeaderRow}>
                    <Ionicons name="server" size={16} color="#00E676" />
                    <Text style={styles.archTitle}>LOCAL-FIRST SQLITE ENGINE</Text>
                  </View>
                  <Text style={styles.archBody}>
                    <Text style={styles.boldWhite}>• How it is created: </Text>
                    The very first time you launch GrimIron, the app automatically initializes your character profile. No email or signup is required.
                  </Text>
                  <Text style={styles.archBody}>
                    <Text style={styles.boldWhite}>• Where it is stored: </Text>
                    Stored directly on your phone's physical internal drive in the app's local SQLite database (<Text style={styles.monoText}>grimiron.db</Text>).
                  </Text>
                  <Text style={styles.archBody}>
                    <Text style={styles.boldWhite}>• Your Local Tactical ID: </Text>
                    Shown as <Text style={styles.monoText}>user_main (Initiate #1)</Text>.
                  </Text>
                  <Text style={styles.archBody}>
                    <Text style={styles.boldWhite}>• How to set your Callsign: </Text>
                    You can edit it below right now, or anytime by opening <Text style={styles.boldWhite}>Settings → 6. Privacy & Account → Edit Warrior Callsign</Text>.
                  </Text>
                </View>

                {/* Interactive Callsign Input */}
                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>CHOOSE YOUR WARRIOR CALLSIGN:</Text>
                  <View style={styles.textInputRow}>
                    <Ionicons name="person-outline" size={18} color="#00E676" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.textInput}
                      value={callsignInput}
                      onChangeText={setCallsignInput}
                      placeholder="e.g. Captain Titus, Inquisitor Vane"
                      placeholderTextColor="#546E7A"
                      maxLength={28}
                      autoCapitalize="words"
                    />
                  </View>
                  <Text style={styles.inputHelper}>
                    This identifier names your crusader in local combat logs and boss battle reports.
                  </Text>
                </View>
              </View>
            )}

            {/* SLIDE 3: CLOUD ACCOUNT & MULTIPLAYER */}
            {currentSlide.id === 'cloud_account' && (
              <View style={styles.bodySection}>
                <View style={styles.architectureCard}>
                  <View style={styles.archHeaderRow}>
                    <Ionicons name="cloud-circle" size={18} color="#FFB800" />
                    <Text style={[styles.archTitle, { color: '#FFB800' }]}>CRUSADE CLOUD (OPTIONAL)</Text>
                  </View>
                  <Text style={styles.archBody}>
                    <Text style={styles.boldWhite}>• Where it is stored: </Text>
                    In the Supabase Cloud Database (<Text style={styles.monoText}>auth.users</Text> and <Text style={styles.monoText}>user_profiles</Text>).
                  </Text>
                  <Text style={styles.archBody}>
                    <Text style={styles.boldWhite}>• What the Cloud Account does: </Text>
                    Assigns your warrior a permanent unique Cloud UUID, and links your local workouts to weekly cooperative raid servers so your attack damage shows up on squad leaderboards alongside other players.
                  </Text>
                  <Text style={styles.archBody}>
                    <Text style={styles.boldWhite}>• 100% Offline Resilient: </Text>
                    All your core workouts, personal records, and achievements remain completely saved locally on your phone even when offline.
                  </Text>
                </View>

                {/* Cloud Status & Account Action Area */}
                <View style={styles.cloudActionCard}>
                  <View style={styles.cloudStatusRow}>
                    <Ionicons
                      name={isCloudAuthenticated ? 'checkmark-circle' : 'radio-button-off'}
                      size={20}
                      color={isCloudAuthenticated ? '#00E676' : '#FFB800'}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.cloudStatusText}>
                        STATUS: {isCloudAuthenticated ? 'CLOUD SYNCHRONIZED' : 'LOCAL OFFLINE MODE'}
                      </Text>
                      {isCloudAuthenticated && cloudEmail ? (
                        <Text style={styles.cloudIdentitySub}>Identity: {cloudEmail}</Text>
                      ) : null}
                    </View>
                  </View>

                  {isCloudAuthenticated ? (
                    <View style={styles.cloudSyncedInfoBox}>
                      <Ionicons name="shield-checkmark" size={16} color="#00E676" />
                      <Text style={styles.cloudSyncedInfoText}>
                        Your crusader profile is synchronized. You can log workouts offline anytime, and squad raid damage will automatically post to cloud leaderboards.
                      </Text>
                      {onResendVerification && cloudEmail ? (
                        <TouchableOpacity style={styles.resendPillBtn} onPress={handleResendVerification}>
                          <Ionicons name="mail-outline" size={13} color="#FFB800" />
                          <Text style={styles.resendPillBtnText}>RESEND VERIFICATION EMAIL</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : (
                    <View style={{ gap: 8, marginTop: 4 }}>
                      <Text style={styles.cloudInstructions}>
                        Create your cloud account now to unlock multiplayer leaderboards and cross-device squad sync.
                      </Text>

                      {/* Primary In-Walkthrough Creation Button */}
                      <TouchableOpacity
                        style={styles.cloudRegisterBtn}
                        onPress={() => handleOpenAuthModal('signup')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="person-add-outline" size={16} color="#121212" />
                        <Text style={styles.cloudRegisterBtnText}>CREATE CLOUD ACCOUNT NOW</Text>
                      </TouchableOpacity>

                      {/* Secondary Sign In Option */}
                      <View style={styles.authAltRow}>
                        <TouchableOpacity onPress={() => handleOpenAuthModal('signin')} style={styles.authAltLink}>
                          <Text style={styles.authAltText}>Already have an account? <Text style={styles.authAltHighlight}>Sign In</Text></Text>
                        </TouchableOpacity>
                      </View>

                      {/* Or Open in Settings */}
                      {onOpenCloudAuth && (
                        <TouchableOpacity
                          style={styles.openSettingsBtn}
                          onPress={onOpenCloudAuth}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="settings-outline" size={14} color="#78909C" />
                          <Text style={styles.openSettingsBtnText}>OR CONFIGURE IN SETTINGS HUB</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* SLIDE 4: FACTIONS & SUBFACTIONS */}
            {currentSlide.id === 'factions' && (
              <View style={styles.bodySection}>
                <View style={styles.featureBox}>
                  <View style={styles.featureRow}>
                    <Ionicons name="planet-outline" size={20} color="#FF3366" />
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>20 WARHAMMER 40K FACTIONS</Text>
                      <Text style={styles.featureDesc}>
                        Pledge loyalty to Space Marines, Astra Militarum, Adeptus Mechanicus, Necrons, T'au, Orks, Chaos, or Tyranids. Earn authentic lore titles as you rank up.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.featureBox}>
                  <View style={styles.featureRow}>
                    <Ionicons name="color-wand-outline" size={20} color="#00F0FF" />
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>CUSTOM SUBFACTION FORGE</Text>
                      <Text style={styles.featureDesc}>
                        Design your own Chapter, Regiment, or Warband. Write custom battle lore, choose doctrine combat tactics, and upload your own emblems directly from your photo gallery.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.featureBox}>
                  <View style={styles.featureRow}>
                    <Ionicons name="shield-half-outline" size={20} color="#FFB800" />
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>FULL FREEDOM OF ALLEGIANCE</Text>
                      <Text style={styles.featureDesc}>
                        Switch active factions anytime without losing progress. Master multiple armies to earn multi-faction Grand Marshal badges.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* SLIDE 5: COMBAT & PROGRESSION */}
            {currentSlide.id === 'combat' && (
              <View style={styles.bodySection}>
                <View style={styles.featureBox}>
                  <View style={styles.featureRow}>
                    <Ionicons name="compass-outline" size={20} color="#FF9100" />
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>WARFRONT // DAILY ENGAGEMENTS</Text>
                      <Text style={styles.featureDesc}>
                        Date-locked procedural combat operations that refresh daily. Deploy your daily training sessions against rotating hostile champions.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.featureBox}>
                  <View style={styles.featureRow}>
                    <Ionicons name="skull-outline" size={20} color="#E53935" />
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>WEEKLY BOSS RAIDS</Text>
                      <Text style={styles.featureDesc}>
                        Massive sector commanders that spawn each week. Chip away at their colossal health bars solo or synchronize damage with your squad.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.featureBox}>
                  <View style={styles.featureRow}>
                    <Ionicons name="ribbon-outline" size={20} color="#00E676" />
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>379 SCALED ACHIEVEMENTS</Text>
                      <Text style={styles.featureDesc}>
                        Track workouts, total tonnage, single-lift personal records, 100+ week streaks, and boss kills. Every milestone earns permanent glory.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Pagination & Action Controls */}
          <View style={styles.footer}>
            {/* Pagination Dots */}
            <View style={styles.paginationRow}>
              {SLIDES.map((s, idx) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => {
                    triggerHaptic.selection();
                    setCurrentSlideIndex(idx);
                  }}
                  style={[
                    styles.paginationDot,
                    idx === currentSlideIndex && styles.paginationDotActive,
                    idx === currentSlideIndex && { backgroundColor: currentSlide.badgeColor },
                  ]}
                />
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              {!isFirstSlide ? (
                <TouchableOpacity style={styles.backButton} onPress={handlePrev} activeOpacity={0.8}>
                  <Ionicons name="chevron-back" size={18} color="#B0BEC5" />
                  <Text style={styles.backButtonText}>PREVIOUS</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: currentSlide.badgeColor },
                ]}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {isLastSlide ? 'COMMENCE CRUSADE' : 'NEXT DIRECTIVE'}
                </Text>
                <Ionicons
                  name={isLastSlide ? 'checkmark' : 'chevron-forward'}
                  size={18}
                  color="#121212"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Embedded Cloud Account Authentication Sub-Modal */}
      <Modal visible={showAuthModal} transparent animationType="slide" onRequestClose={() => setShowAuthModal(false)}>
        <View style={styles.authModalOverlay}>
          <View style={styles.authModalContainer}>
            <View style={styles.authHeader}>
              <View style={styles.authHeaderTitleRow}>
                <Ionicons name="cloud-upload" size={20} color="#FFB800" />
                <Text style={styles.authHeaderTitle}>
                  {authMode === 'signup' ? 'REGISTER CLOUD ACCOUNT' : 'CRUSADE CLOUD SIGN IN'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAuthModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#90A4AE" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              {/* Tab Selector */}
              <View style={styles.authTabSelector}>
                <TouchableOpacity
                  style={[styles.authTabBtn, authMode === 'signup' && styles.authTabBtnActive]}
                  onPress={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                  }}
                >
                  <Text style={[styles.authTabBtnText, authMode === 'signup' && styles.authTabBtnTextActive]}>
                    CREATE ACCOUNT
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.authTabBtn, authMode === 'signin' && styles.authTabBtnActive]}
                  onPress={() => {
                    setAuthMode('signin');
                    setAuthError(null);
                  }}
                >
                  <Text style={[styles.authTabBtnText, authMode === 'signin' && styles.authTabBtnTextActive]}>
                    SIGN IN
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Callout */}
              {authError ? (
                <View style={styles.authErrorCallout}>
                  <Ionicons name="alert-circle" size={16} color="#FF5252" />
                  <Text style={styles.authErrorCalloutText}>{authError}</Text>
                </View>
              ) : null}

              {/* Callsign Field (for signup) */}
              {authMode === 'signup' ? (
                <View style={styles.authInputGroup}>
                  <Text style={styles.authInputLabel}>TACTICAL CALLSIGN</Text>
                  <TextInput
                    style={styles.authTextInput}
                    value={authCallsign}
                    onChangeText={setAuthCallsign}
                    placeholder="e.g. Captain Titus"
                    placeholderTextColor="#546E7A"
                    autoCapitalize="words"
                    maxLength={28}
                  />
                  <Text style={styles.authInputHint}>Your public identity displayed on squad raid leaderboards.</Text>
                </View>
              ) : null}

              {/* Email Field */}
              <View style={styles.authInputGroup}>
                <Text style={styles.authInputLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.authTextInput}
                  value={authEmail}
                  onChangeText={setAuthEmail}
                  placeholder="warrior@crusade.net"
                  placeholderTextColor="#546E7A"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Password Field */}
              <View style={styles.authInputGroup}>
                <Text style={styles.authInputLabel}>SECURITY PASSWORD</Text>
                <TextInput
                  style={styles.authTextInput}
                  value={authPassword}
                  onChangeText={setAuthPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#546E7A"
                  secureTextEntry
                />
              </View>

              {/* Email Notice Callout */}
              <View style={styles.authEmailNoticeBox}>
                <Ionicons name="mail-outline" size={14} color="#78909C" />
                <Text style={styles.authEmailNoticeText}>
                  Upon registration, a verification transmission will be sent to your email. Check your Inbox and Spam/Junk folder.
                </Text>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.authSubmitBtn}
                onPress={handleAuthSubmit}
                disabled={authLoading}
                activeOpacity={0.8}
              >
                {authLoading ? (
                  <ActivityIndicator size="small" color="#121212" />
                ) : (
                  <>
                    <Ionicons name={authMode === 'signup' ? 'person-add' : 'log-in'} size={17} color="#121212" />
                    <Text style={styles.authSubmitBtnText}>
                      {authMode === 'signup' ? 'REGISTER & SYNC CRUSADER' : 'SIGN IN & LINK CLOUD'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.authCancelBtn}
                onPress={() => setShowAuthModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.authCancelBtnText}>CANCEL & CONTINUE WALKTHROUGH</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#12161F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A3644',
    width: '100%',
    maxHeight: '92%',
    minHeight: '80%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2633',
    backgroundColor: '#0F131A',
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  headerPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  slideCounterText: {
    color: '#78909C',
    fontSize: 11,
    fontWeight: '700',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipButtonText: {
    color: '#78909C',
    fontSize: 11,
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  slideTitle: {
    color: '#ECEFF1',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  slideSubtitle: {
    color: '#90A4AE',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  bodySection: {
    gap: 12,
  },
  featureBox: {
    backgroundColor: '#181E29',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242F3E',
    padding: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    color: '#CFD8DC',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  featureDesc: {
    color: '#90A4AE',
    fontSize: 12,
    lineHeight: 17,
  },
  architectureCard: {
    backgroundColor: '#161D27',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#263344',
    padding: 14,
    gap: 8,
  },
  archHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  archTitle: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  archBody: {
    color: '#B0BEC5',
    fontSize: 12,
    lineHeight: 18,
  },
  boldWhite: {
    color: '#ECEFF1',
    fontWeight: '700',
  },
  monoText: {
    color: '#00F0FF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: '#181E29',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A3A4E',
    padding: 14,
  },
  inputLabel: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F131A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#37474F',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  inputHelper: {
    color: '#78909C',
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
  },
  cloudActionCard: {
    backgroundColor: '#181E29',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A3A4E',
    padding: 14,
    gap: 10,
  },
  cloudStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cloudStatusText: {
    color: '#ECEFF1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cloudIdentitySub: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  cloudSyncedInfoBox: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    padding: 10,
    gap: 6,
  },
  cloudSyncedInfoText: {
    color: '#B0BEC5',
    fontSize: 11,
    lineHeight: 16,
  },
  resendPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  resendPillBtnText: {
    color: '#FFB800',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cloudInstructions: {
    color: '#90A4AE',
    fontSize: 12,
    lineHeight: 17,
  },
  cloudRegisterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFB800',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  cloudRegisterBtnText: {
    color: '#121212',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  authAltRow: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  authAltLink: {
    padding: 4,
  },
  authAltText: {
    color: '#90A4AE',
    fontSize: 11,
  },
  authAltHighlight: {
    color: '#00F0FF',
    fontWeight: '800',
  },
  openSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#12161F',
    borderWidth: 1,
    borderColor: '#2C3A4C',
    borderRadius: 8,
    paddingVertical: 8,
  },
  openSettingsBtnText: {
    color: '#90A4AE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E2633',
    backgroundColor: '#0F131A',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2A3644',
  },
  paginationDotActive: {
    width: 22,
    borderRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E2633',
    borderRadius: 8,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#B0BEC5',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#121212',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // Auth Sub-Modal Styles
  authModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  authModalContainer: {
    backgroundColor: '#161C26',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#37474F',
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
  },
  authHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#242F3E',
    backgroundColor: '#0F131A',
  },
  authHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authHeaderTitle: {
    color: '#ECEFF1',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  authTabSelector: {
    flexDirection: 'row',
    backgroundColor: '#0F131A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#263238',
    marginBottom: 12,
    overflow: 'hidden',
  },
  authTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authTabBtnActive: {
    backgroundColor: '#263238',
  },
  authTabBtnText: {
    color: '#78909C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  authTabBtnTextActive: {
    color: '#FFFFFF',
  },
  authErrorCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderWidth: 1,
    borderColor: '#FF5252',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  authErrorCalloutText: {
    color: '#FF8A80',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  authInputGroup: {
    marginBottom: 10,
  },
  authInputLabel: {
    color: '#CFD8DC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  authTextInput: {
    backgroundColor: '#0C0F15',
    borderWidth: 1,
    borderColor: '#37474F',
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
  },
  authInputHint: {
    color: '#78909C',
    fontSize: 10,
    marginTop: 4,
  },
  authEmailNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#0D1117',
    padding: 8,
    borderRadius: 6,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#1E2633',
  },
  authEmailNoticeText: {
    color: '#90A4AE',
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  authSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFB800',
    borderRadius: 8,
    paddingVertical: 11,
    marginTop: 4,
  },
  authSubmitBtnText: {
    color: '#121212',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  authCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  authCancelBtnText: {
    color: '#78909C',
    fontSize: 11,
    fontWeight: '700',
  },
});
