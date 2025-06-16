import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Vibration,
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
type UpdateOrderScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'UpdateOrder'
>;

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
  const [animatingModuleId, setAnimatingModuleId] = useState<string | null>(
    null,
  );
  const [animatingResourceId, setAnimatingResourceId] = useState<string | null>(
    null,
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Función para mover módulos completos
  const moveModuleUp = (moduleIndex: number) => {
    if (moduleIndex === 0) return; // No se puede mover más arriba

    const moduleId = modules[moduleIndex].module_id;
    setAnimatingModuleId(moduleId);
    Vibration.vibrate(50); // Feedback háptico suave

    const newModules = [...modules];
    // Intercambiar el módulo actual con el anterior
    [newModules[moduleIndex], newModules[moduleIndex - 1]] = [
      newModules[moduleIndex - 1],
      newModules[moduleIndex],
    ];

    // Actualizar el orden de los módulos
    const updatedModules = newModules.map((module, index) => ({
      ...module,
      order: index + 1,
    }));

    setModules(updatedModules);
    setHasChanges(true);

    // Quitar la animación después de un tiempo
    setTimeout(() => setAnimatingModuleId(null), 600);
  };

  const moveModuleDown = (moduleIndex: number) => {
    if (moduleIndex === modules.length - 1) return; // No se puede mover más abajo

    const moduleId = modules[moduleIndex].module_id;
    setAnimatingModuleId(moduleId);
    Vibration.vibrate(50); // Feedback háptico suave

    const newModules = [...modules];
    // Intercambiar el módulo actual con el siguiente
    [newModules[moduleIndex], newModules[moduleIndex + 1]] = [
      newModules[moduleIndex + 1],
      newModules[moduleIndex],
    ];

    // Actualizar el orden de los módulos
    const updatedModules = newModules.map((module, index) => ({
      ...module,
      order: index + 1,
    }));

    setModules(updatedModules);
    setHasChanges(true);

    // Quitar la animación después de un tiempo
    setTimeout(() => setAnimatingModuleId(null), 600);
  };

  // Función para mover recursos dentro del mismo módulo únicamente
  const moveResourceUp = (moduleIndex: number, resourceIndex: number) => {
    if (resourceIndex === 0) return; // No se puede mover más arriba

    const resourceId = modules[moduleIndex].resources[resourceIndex].id;
    setAnimatingResourceId(resourceId);
    Vibration.vibrate(30); // Feedback háptico más suave para recursos

    const newModules = [...modules];
    const moduleResources = [...newModules[moduleIndex].resources];
    // Intercambiar el recurso actual con el anterior
    [moduleResources[resourceIndex], moduleResources[resourceIndex - 1]] = [
      moduleResources[resourceIndex - 1],
      moduleResources[resourceIndex],
    ];
    newModules[moduleIndex].resources = moduleResources;
    setModules(newModules);
    setHasChanges(true);

    // Quitar la animación después de un tiempo
    setTimeout(() => setAnimatingResourceId(null), 400);
  };

  const moveResourceDown = (moduleIndex: number, resourceIndex: number) => {
    const module = modules[moduleIndex];
    if (resourceIndex === module.resources.length - 1) return; // No se puede mover más abajo

    const resourceId = modules[moduleIndex].resources[resourceIndex].id;
    setAnimatingResourceId(resourceId);
    Vibration.vibrate(30); // Feedback háptico más suave para recursos

    const newModules = [...modules];
    const moduleResources = [...newModules[moduleIndex].resources];
    // Intercambiar el recurso actual con el siguiente
    [moduleResources[resourceIndex], moduleResources[resourceIndex + 1]] = [
      moduleResources[resourceIndex + 1],
      moduleResources[resourceIndex],
    ];
    newModules[moduleIndex].resources = moduleResources;
    setModules(newModules);
    setHasChanges(true);

    // Quitar la animación después de un tiempo
    setTimeout(() => setAnimatingResourceId(null), 400);
  };

  // Función para guardar el nuevo orden
  const handleSaveOrder = async () => {
    try {
      setIsLoading(true);

      // Preparar datos para el endpoint según el formato requerido
      const modulesData = modules.map((module) => ({
        module_id: parseInt(module.module_id), // Convertir a número si es necesario
        resources: module.resources.map((resource) => ({
          id: resource.id,
        })),
      }));

      const requestBody = {
        modules: modulesData,
      };

      console.log('Enviando datos:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        `${API_URL}/api/courses/${course.id}/resources`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

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
      Alert.alert(
        'Error',
        'Network error. Please check your connection and try again.',
      );
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
        <Text style={styles.headerSubtitle}>
          {hasChanges
            ? '✓ Changes detected - Ready to save'
            : 'Drag items to reorder'}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {modules.map((module, moduleIndex) => (
          <View
            key={module.module_id}
            style={[
              styles.moduleContainer,
              animatingModuleId === module.module_id && styles.animatingModule,
            ]}
          >
            {/* Module Header with move buttons - Mueve módulos completos */}
            <View style={styles.moduleHeader}>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleTitle}>
                  Module {moduleIndex + 1}: {module.title}
                </Text>
                <Text style={styles.moduleSubtitle}>
                  {module.resources.length} resources
                </Text>
              </View>
              <View style={styles.moduleActions}>
                <TouchableOpacity
                  disabled={moduleIndex === 0}
                  onPress={() => moveModuleUp(moduleIndex)}
                  style={[
                    styles.moveButton,
                    moduleIndex === 0 && styles.disabledButton,
                  ]}
                >
                  <Feather
                    name="chevron-up"
                    size={20}
                    color={moduleIndex === 0 ? '#ccc' : '#007AFF'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={moduleIndex === modules.length - 1}
                  onPress={() => moveModuleDown(moduleIndex)}
                  style={[
                    styles.moveButton,
                    moduleIndex === modules.length - 1 && styles.disabledButton,
                  ]}
                >
                  <Feather
                    name="chevron-down"
                    size={20}
                    color={
                      moduleIndex === modules.length - 1 ? '#ccc' : '#007AFF'
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Resources - Solo se mueven dentro del mismo módulo */}
            <View style={styles.resourcesContainer}>
              {module.resources.map((resource, resourceIndex) => (
                <View
                  key={resource.id}
                  style={[
                    styles.resourceItem,
                    animatingResourceId === resource.id &&
                      styles.animatingResource,
                  ]}
                >
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceName}>{resource.name}</Text>
                    <Text style={styles.resourceType}>{resource.type}</Text>
                  </View>
                  <View style={styles.resourceActions}>
                    <TouchableOpacity
                      disabled={resourceIndex === 0}
                      onPress={() => moveResourceUp(moduleIndex, resourceIndex)}
                      style={[
                        styles.moveButton,
                        resourceIndex === 0 && styles.disabledButton,
                      ]}
                    >
                      <Feather
                        name="chevron-up"
                        size={16}
                        color={resourceIndex === 0 ? '#ccc' : '#007AFF'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={resourceIndex === module.resources.length - 1}
                      onPress={() =>
                        moveResourceDown(moduleIndex, resourceIndex)
                      }
                      style={[
                        styles.moveButton,
                        resourceIndex === module.resources.length - 1 &&
                          styles.disabledButton,
                      ]}
                    >
                      <Feather
                        name="chevron-down"
                        size={16}
                        color={
                          resourceIndex === module.resources.length - 1
                            ? '#ccc'
                            : '#007AFF'
                        }
                      />
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
        <TouchableOpacity
          style={[styles.saveButton, hasChanges && styles.saveButtonHighlight]}
          onPress={handleSaveOrder}
        >
          <Text
            style={[
              styles.saveButtonText,
              hasChanges && styles.saveButtonTextHighlight,
            ]}
          >
            {hasChanges ? 'Save Changes' : 'Save Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 4,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  moduleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    transform: [{ scale: 1 }],
  },
  animatingModule: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
    shadowColor: '#2196f3',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  moduleSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  moduleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resourcesContainer: {
    padding: 12,
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
    transform: [{ scale: 1 }],
  },
  animatingResource: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
    borderWidth: 2,
    shadowColor: '#ff9800',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  resourceType: {
    fontSize: 14,
    color: '#6c757d',
    textTransform: 'capitalize',
  },
  resourceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  moveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#f8f9fa',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc3545',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    transform: [{ scale: 1 }],
  },
  saveButtonHighlight: {
    backgroundColor: '#28a745',
    shadowColor: '#28a745',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  saveButtonTextHighlight: {
    fontWeight: 'bold',
  },
});
