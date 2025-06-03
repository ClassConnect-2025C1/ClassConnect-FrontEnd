import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../navigation/AuthContext';
import { API_URL } from '@env';
import { Feather } from '@expo/vector-icons';
import StatusOverlay from '../../../components/StatusOverlay';

interface Resource {
  id: string;
  type: string;
  name: string;
  url: string;
}

interface Module {
  module_id: string;
  title: string;
  order: number;
  resources: Resource[];
}

type RootStackParamList = {
  UpdateOrder: {
    course: any;
    modules: Module[];
  };
};

type UpdateOrderScreenRouteProp = RouteProp<RootStackParamList, 'UpdateOrder'>;
type UpdateOrderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpdateOrder'>;

interface UpdateOrderProps {
  route: UpdateOrderScreenRouteProp;
  navigation: UpdateOrderScreenNavigationProp;
}

export default function UpdateOrder({ route }: UpdateOrderProps) {
  const { course, modules: initialModules } = route.params;
  const navigation = useNavigation();
  const { token } = useAuth();
  
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveChangueConfirmed, setSaveChangueConfirmed] = useState(false);

  // Función para mover módulos completos
  const moveModule = (fromIndex: number, toIndex: number) => {
    const newModules = [...modules];
    const [movedModule] = newModules.splice(fromIndex, 1);
    newModules.splice(toIndex, 0, movedModule);
    
    // Actualizar el orden de los módulos
    const updatedModules = newModules.map((module, index) => ({
      ...module,
      order: index + 1
    }));
    
    setModules(updatedModules);
  };

  // Función para mover recursos dentro del mismo módulo únicamente
  const moveResource = (moduleIndex: number, fromIndex: number, toIndex: number) => {
    const newModules = [...modules];
    const moduleResources = [...newModules[moduleIndex].resources];
    const [movedResource] = moduleResources.splice(fromIndex, 1);
    moduleResources.splice(toIndex, 0, movedResource);
    newModules[moduleIndex].resources = moduleResources;
    setModules(newModules);
  };

  // Función para guardar el nuevo orden
  const handleSaveOrder = async () => {
    try {
      setIsLoading(true);
      
      // Preparar datos para el endpoint
      const modulesData = modules.map((module, index) => ({
        module_id: module.module_id,
        order: index + 1,
        resources: module.resources.map(resource => resource.id)
      }));

      const response = await fetch(`${API_URL}/api/courses/${course.id}/resources`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          modules: modulesData
        }),
      });

      if (response.ok) {
        setSaveChangueConfirmed(true);
        setTimeout(() => {
          setIsLoading(false);
          setSaveChangueConfirmed(false);
          navigation.goBack();
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error('Error updating order:', errorData);
        setIsLoading(false);
        Alert.alert('Error', 'Failed to update order. Please try again.');
      }
    } catch (error) {
      console.error('Network error updating order:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    }
  };

  // Función de cancelar simplificada - solo hace goBack
  const handleCancel = () => {
    navigation.goBack();
  };

  return isLoading ? (
    <StatusOverlay
      loading={!saveChangueConfirmed}
      success={saveChangueConfirmed}
      loadingMsg="Updating order..."
      successMsg="Order updated successfully!"
    />
  ) : (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Update Order</Text>
        <Text style={styles.headerSubtitle}>Drag items to reorder</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {modules.map((module, moduleIndex) => (
          <View key={module.module_id} style={styles.moduleContainer}>
            {/* Module Header with move buttons - Mueve módulos completos */}
            <View style={styles.moduleHeader}>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleTitle}>Module {moduleIndex + 1}: {module.title}</Text>
                <Text style={styles.moduleSubtitle}>{module.resources.length} resources</Text>
              </View>
              <View style={styles.moduleActions}>
                <TouchableOpacity
                  disabled={moduleIndex === 0}
                  onPress={() => moveModule(moduleIndex, moduleIndex - 1)}
                  style={[styles.moveButton, moduleIndex === 0 && styles.disabledButton]}
                >
                  <Feather name="chevron-up" size={20} color={moduleIndex === 0 ? "#ccc" : "#007AFF"} />
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={moduleIndex === modules.length - 1}
                  onPress={() => moveModule(moduleIndex, moduleIndex + 1)}
                  style={[styles.moveButton, moduleIndex === modules.length - 1 && styles.disabledButton]}
                >
                  <Feather name="chevron-down" size={20} color={moduleIndex === modules.length - 1 ? "#ccc" : "#007AFF"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Resources - Solo se mueven dentro del mismo módulo */}
            <View style={styles.resourcesContainer}>
              {module.resources.map((resource, resourceIndex) => (
                <View key={resource.id} style={styles.resourceItem}>
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceName}>{resource.name}</Text>
                    <Text style={styles.resourceType}>{resource.type}</Text>
                  </View>
                  <View style={styles.resourceActions}>
                    <TouchableOpacity
                      disabled={resourceIndex === 0}
                      onPress={() => moveResource(moduleIndex, resourceIndex, resourceIndex - 1)}
                      style={[styles.moveButton, resourceIndex === 0 && styles.disabledButton]}
                    >
                      <Feather name="chevron-up" size={16} color={resourceIndex === 0 ? "#ccc" : "#007AFF"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={resourceIndex === module.resources.length - 1}
                      onPress={() => moveResource(moduleIndex, resourceIndex, resourceIndex + 1)}
                      style={[styles.moveButton, resourceIndex === module.resources.length - 1 && styles.disabledButton]}
                    >
                      <Feather name="chevron-down" size={16} color={resourceIndex === module.resources.length - 1 ? "#ccc" : "#007AFF"} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveOrder}>
          <Text style={styles.saveButtonText}>Save Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  moduleContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  moduleSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  moduleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  moveButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  disabledButton: {
    opacity: 0.5,
  },
  resourcesContainer: {
    padding: 16,
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  resourceType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  resourceActions: {
    flexDirection: 'row',
    gap: 4,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});