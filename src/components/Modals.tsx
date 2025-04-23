import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type AcceptRejectModalProps = {
  visible: boolean;
  message: string;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
};

export const AcceptRejectModal = ({
  visible,
  message,
  onAccept,
  onReject,
  onClose,
}: AcceptRejectModalProps) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onReject} style={styles.cancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAccept} style={styles.confirm}>
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

type AcceptOnlyModalProps = {
  visible: boolean;
  message: string;
  onAccept: () => void;
  onClose: () => void;
};

export const AcceptOnlyModal = ({
  visible,
  message,
  onAccept,
  onClose,
}: AcceptOnlyModalProps) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onAccept}
              style={styles.confirm}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    width: '80%',
    borderRadius: 10,
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancel: {
    backgroundColor: '#999',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  confirm: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});

