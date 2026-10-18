import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { SciFiCard } from './SciFiCard';
import { TerminalButton } from './TerminalButton';
import { ProgressBar } from './ProgressBar';
import { Badge } from './Badge';
import {
  CampaignDefinition,
  CampaignNode,
  CampaignTelemetryContext,
} from '../types/campaign';
import {
  CAMPAIGN_CATALOG,
  getDefaultCampaign,
} from '../content/campaigns/catalog';
import {
  evaluateFullCampaign,
  NodeEvaluationResult,
} from '../services/progression/campaignEvaluator';

interface CampaignMapModalProps {
  visible: boolean;
  onClose: () => void;
  telemetryContext: CampaignTelemetryContext;
  onDeployNode: (node: CampaignNode) => void;
}

export const CampaignMapModal: React.FC<CampaignMapModalProps> = ({
  visible,
  onClose,
  telemetryContext,
  onDeployNode,
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    getDefaultCampaign().id
  );
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);

  const campaign = useMemo(() => {
    return (
      CAMPAIGN_CATALOG.find((c) => c.id === selectedCampaignId) ||
      getDefaultCampaign()
    );
  }, [selectedCampaignId]);

  // Evaluate campaign graph
  const evaluation = useMemo(() => {
    return evaluateFullCampaign(campaign, telemetryContext);
  }, [campaign, telemetryContext]);

  const inspectedNode = useMemo(() => {
    if (!inspectedNodeId) return null;
    return campaign.nodes.find((n) => n.id === inspectedNodeId) || null;
  }, [campaign, inspectedNodeId]);

  const inspectedEval: NodeEvaluationResult | null = useMemo(() => {
    if (!inspectedNodeId) return null;
    return evaluation.evaluations[inspectedNodeId] || null;
  }, [evaluation, inspectedNodeId]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="map-outline" size={24} color={THEME.colors.primary} />
            <Text style={styles.headerTitle}>PLANETARY CAMPAIGN THEATER</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Campaign Overview Dossier */}
          <SciFiCard
            title={campaign.title.toUpperCase()}
            variant="accent"
            rightAction={
              <Badge
                label={`${evaluation.campaignProgressPercent}% CONQUERED`}
                variant="primary"
              />
            }
          >
            <Text style={styles.sectorText}>{campaign.sectorName}</Text>
            <Text style={styles.briefingText}>{campaign.narrativeBriefing}</Text>

            <ProgressBar
              progress={evaluation.campaignProgressPercent}
              label="Theater Pacification Progress"
              valueText={`${evaluation.completedNodeIds.length} / ${campaign.nodes.length} Sectors Secured`}
              color={THEME.colors.primary}
              height={8}
            />
          </SciFiCard>

          {/* Section Heading */}
          <Text style={styles.graphHeading}>THEATER SECTOR NODES // DIRECTED ASSAULT GRAPH</Text>

          {/* Render Graph Nodes */}
          {campaign.nodes.map((node, idx) => {
            const nodeEval = evaluation.evaluations[node.id];
            const isCompleted = nodeEval?.isCompleted;
            const isUnlocked = nodeEval?.isUnlocked;
            const isInspected = inspectedNodeId === node.id;

            let statusVariant: 'success' | 'primary' | 'neutral' = 'neutral';
            let statusLabel = 'LOCKED';
            if (isCompleted) {
              statusVariant = 'success';
              statusLabel = 'SECURED';
            } else if (isUnlocked) {
              statusVariant = 'primary';
              statusLabel = 'ACTIVE OBJECTIVE';
            }

            return (
              <TouchableOpacity
                key={node.id}
                activeOpacity={0.85}
                onPress={() => setInspectedNodeId(isInspected ? null : node.id)}
              >
                <SciFiCard
                  title={`${idx + 1}. ${node.title.toUpperCase()}`}
                  variant={isCompleted ? 'normal' : isUnlocked ? 'accent' : 'normal'}
                  style={{
                    ...styles.nodeCard,
                    ...(isInspected ? styles.nodeCardSelected : {}),
                    ...(!isUnlocked ? styles.nodeCardLocked : {}),
                  }}
                  rightAction={<Badge label={statusLabel} variant={statusVariant} />}
                >
                  <Text style={styles.nodeCodeName}>{node.codeName}</Text>
                  <Text style={styles.nodeDesc}>{node.description}</Text>

                  {/* Branch Callout */}
                  {node.isBranchPoint && (
                    <View style={styles.branchNotice}>
                      <Ionicons name="git-branch-outline" size={14} color={THEME.colors.secondary} />
                      <Text style={styles.branchText}>{node.branchLabel}</Text>
                    </View>
                  )}

                  {/* Requirements Checklist */}
                  <View style={styles.requirementsSection}>
                    <Text style={styles.reqHeader}>UNLOCK & COMPLETION REQUIREMENTS:</Text>
                    {nodeEval?.requirementsStatus.map((req) => (
                      <View key={req.requirementId} style={styles.reqRow}>
                        <Ionicons
                          name={req.isMet ? 'checkmark-circle' : 'ellipse-outline'}
                          size={14}
                          color={req.isMet ? THEME.colors.success : THEME.colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.reqDesc,
                            req.isMet && styles.reqDescMet,
                          ]}
                        >
                          {req.description} ({req.currentValue} / {req.targetValue})
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Button */}
                  {isUnlocked && !isCompleted && (
                    <View style={styles.deployBtnContainer}>
                      <TerminalButton
                        title="DEPLOY TO SECTOR"
                        onPress={() => {
                          onDeployNode(node);
                          onClose();
                        }}
                        variant="primary"
                        size="sm"
                        icon={<Ionicons name="navigate-outline" size={14} color="#0A0E17" />}
                      />
                    </View>
                  )}
                </SciFiCard>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: THEME.colors.textBright,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 8,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectorText: {
    color: THEME.colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  briefingText: {
    color: THEME.colors.textMain,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  graphHeading: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.0,
    marginTop: 18,
    marginBottom: 10,
  },
  nodeCard: {
    marginBottom: 12,
  },
  nodeCardSelected: {
    borderColor: THEME.colors.primary,
  },
  nodeCardLocked: {
    opacity: 0.65,
  },
  nodeCodeName: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  nodeDesc: {
    color: THEME.colors.textMain,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  branchNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(77, 171, 247, 0.12)',
    padding: 6,
    borderRadius: 4,
    marginBottom: 10,
  },
  branchText: {
    color: THEME.colors.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  requirementsSection: {
    backgroundColor: THEME.colors.surfaceHighlight,
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  reqHeader: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  reqDesc: {
    color: THEME.colors.textMain,
    fontSize: 11,
    flex: 1,
  },
  reqDescMet: {
    color: THEME.colors.success,
  },
  deployBtnContainer: {
    alignItems: 'flex-end',
  },
});
