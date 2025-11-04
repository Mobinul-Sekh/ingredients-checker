import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useRoute, useNavigation, StackActions } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';

const IngredientCard = ({ data }: { data: Record<string, any> }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <Text style={styles.ingredient}>{data.ingredient}</Text>
      <Text style={styles.description}>{data.description}</Text>

      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={styles.toggleButton}>
          {expanded ? 'Hide Details' : 'Show Details'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.details}>
          <Text style={styles.sectionTitle}>Effect:</Text>
          <View style={{ marginLeft: 10 }}>
            <Section title="Positive:" content={data.effects.positive} />
            <Section title="Negative:" content={data.effects.negative} />
          </View>
          <Section title="Nutrition:" content={data.nutrition} />
          <Section title="Statistics:" content={data.statistics} />
          <Section title="Regulations:" content={data.regulations} />
          <Section title="Considerations:" content={data.considerations} />
        </View>
      )}
    </View>
  );
};

const Section = ({ title, content }: { title: string; content: any }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionContent}>{content}</Text>
  </View>
);

const IngredientList = () => {
  const route = useRoute();
  const { ingredients } = route.params as { ingredients: any };
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: 'Ingredient Details',
    });
  }, [])

  // ✅ Ensure ingredients is an array
  let parsedIngredients: any[] = [];

  if (Array.isArray(ingredients)) {
    // already an array
    parsedIngredients = ingredients;
  } else if (typeof ingredients === 'string') {
    try {
      parsedIngredients = JSON.parse(ingredients);
    } catch (err) {
      console.error("Failed to parse ingredients:", err);
      parsedIngredients = [];
    }
  } else {
    console.warn("Unexpected ingredients type:", typeof ingredients);
    parsedIngredients = [];
  }

  return (
    <GestureHandlerRootView>
      <SafeAreaView>
        <ScrollView style={styles.scrollView}>
          {parsedIngredients.length > 0 ? (
            parsedIngredients.map((item, idx) => (
              <IngredientCard key={idx} data={item} />
            ))
          ) : (
            <ThemedText>No ingredients found.</ThemedText>
          )}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    paddingTop: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ingredient: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: 4,
  },
  toggleButton: {
    color: '#2563EB',
    marginTop: 8,
  },
  details: {
    marginTop: 12,
    gap: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionContent: {
    fontSize: 14,
    color: '#4B5563',
  },
});

export default IngredientList;
