import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRoute } from '@react-navigation/native';

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
            <Section title="Positive:" content={data.effects.positive}/>
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
  const { ingredients } = route.params as { ingredients: any[] };

  if (!Array.isArray(ingredients)) {
    return <Text style={{ color: 'red' }}>Invalid ingredients data</Text>;
  }

  return (
    <ScrollView style={styles.scrollView}>
      {ingredients.map((item, idx) => (
        <IngredientCard key={idx} data={item} />
      ))}
    </ScrollView>
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
