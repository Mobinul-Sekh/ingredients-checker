import { SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useCallback, useEffect, useState } from 'react';
import { BACKEND_URL } from '@/constants/ENVs';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { convertToIST } from '@/utils/dateTime';
import { useNavigation, StackActions, useFocusEffect } from '@react-navigation/native';
import LoadingScreen from '../loading';

export default function TabTwoScreen() {
  const [history, setHistory] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/get-all-analysis-results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const resJson = await res.json();
      if (resJson.success) {
        setHistory(resJson.data);
      }
    } catch (e) {
      console.error("Error while fetching history -> ", e);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectHistory = (selectedHistory: any[]) => {
    try {
      navigation.dispatch(StackActions.push('ingredient', { ingredients: selectedHistory }));
    } catch (e) {
      console.error("Error while fetching history -> ", e);
      navigation.dispatch(StackActions.push('error', { error: e }));
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );  

  return (
    <GestureHandlerRootView>
      <SafeAreaView>
        {/* {loading ?
          <LoadingScreen /> : */}
          <ScrollView style={styles.scrollView}>
            {history?.map((hist: any, idx: number) => {
              const parsedResult = JSON.parse(hist?.result);

              const ingredients = parsedResult
                .slice(0, 3)
                .map((item: any) => item?.ingredient)
                .join(", ")
                .substring(0, 70);

              return (
                <TouchableOpacity key={idx} style={styles.historyTitle} onPress={() => handleSelectHistory(parsedResult)}>
                  <ThemedText style={styles.sectionTitle}>
                    {ingredients}...
                  </ThemedText>
                  <ThemedText style={styles.sectionTitle}>
                    {convertToIST(hist.created_at)}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        {/* } */}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    paddingTop: 16,
  },
  historyTitle: {
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
    display: 'flex',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  }
});