import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Modal, Alert } from 'react-native'
import { reportPost, ReportReason, PostType } from '../lib/data'
import { hapticMedium, hapticError } from '../lib/haptics'

const REASONS: Array<{ key: ReportReason; label: string; emoji: string }> = [
  { key: 'spam', label: 'Spam', emoji: '🗑️' },
  { key: 'harassment', label: 'Trakasseri', emoji: '🚫' },
  { key: 'nudity', label: 'Nakenhet', emoji: '🙈' },
  { key: 'violence', label: 'Våld', emoji: '⚔️' },
  { key: 'other', label: 'Annat', emoji: '❓' },
]

type Props = {
  postType: PostType
  postId: string
  compact?: boolean
}

export function ReportPostButton({ postType, postId, compact }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleReport(reason: ReportReason) {
    if (busy) return
    setBusy(true)
    try {
      await reportPost(postType, postId, reason)
      hapticMedium()
      setOpen(false)
      Alert.alert('Tack', 'Rapporten har skickats. Vi tittar på det.')
    } catch (e: any) {
      hapticError()
      Alert.alert('Fel', e?.message ?? 'Kunde inte skicka rapport')
    } finally { setBusy(false) }
  }

  return (
    <>
      <Pressable style={compact ? styles.compactBtn : styles.btn} onPress={() => setOpen(true)}>
        <Text style={compact ? styles.compactText : styles.btnText}>🚩 {compact ? '' : 'Rapportera'}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.title}>Rapportera inlägg</Text>
            <Text style={styles.sub}>Varför rapporterar du detta?</Text>
            {REASONS.map(r => (
              <Pressable
                key={r.key}
                style={styles.row}
                onPress={() => handleReport(r.key)}
                disabled={busy}
              >
                <Text style={styles.rowEmoji}>{r.emoji}</Text>
                <Text style={styles.rowLabel}>{r.label}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Avbryt</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  btnText: { fontSize: 13, color: '#666' },
  compactBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  compactText: { fontSize: 16, color: '#999' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  sub: { fontSize: 13, color: '#666', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f3f3f3' },
  rowEmoji: { fontSize: 22 },
  rowLabel: { fontSize: 15, color: '#222' },
  cancel: { marginTop: 16, padding: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#0F6E56', fontWeight: '500' },
})
