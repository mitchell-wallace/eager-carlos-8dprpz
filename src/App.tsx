/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
  Button,
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Card,
  CardContent,
  Chip,
  Badge,
  Divider,
  Tooltip,
  alpha,
  useTheme,
  Zoom,
  Fab,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Timeline as TimelineIcon,
  InsertChart as InsertChartIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, addDays, parseISO, subDays } from "date-fns";

// Types
interface Habit {
  id: string;
  name: string;
  color: string;
  description: string;
  linkedResultIds: string[];
}

interface Result {
  id: string;
  name: string;
  description: string;
  color: string;
  linkedHabitIds: string[];
}

interface HabitEntry {
  habitId: string;
  date: string; // ISO string
  completed: boolean;
}

interface ResultEntry {
  resultId: string;
  date: string; // ISO string
  value: number; // 0-5
}

// Custom hook for localStorage persistence
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// Generate random pastel color
const generatePastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 80%)`;
};

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const theme = useTheme();
  const [habits, setHabits] = useLocalStorage<Habit[]>("habits", []);
  const [results, setResults] = useLocalStorage<Result[]>("results", []);
  const [habitEntries, setHabitEntries] = useLocalStorage<HabitEntry[]>(
    "habitEntries",
    []
  );
  const [resultEntries, setResultEntries] = useLocalStorage<ResultEntry[]>(
    "resultEntries",
    []
  );

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  // const [resultModalOpen, setResultModalOpen] = useState(false);
  // const [habitLinkModalOpen, setHabitLinkModalOpen] = useState(false);
  // const [visualizationModalOpen, setVisualizationModalOpen] = useState(false);

  const [currentHabit, setCurrentHabit] = useState<Habit | null>(null);
  const [currentResult, setCurrentResult] = useState<Result | null>(null);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDesc, setNewHabitDesc] = useState("");
  const [newResultName, setNewResultName] = useState("");
  const [newResultDesc, setNewResultDesc] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  // Format date for display
  const formattedDate = format(selectedDate, "EEEE, MMMM d, yyyy");
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Navigation between dates
  const goToPreviousDay = () => setSelectedDate((prev) => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate((prev) => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Add/Edit Habit
  const handleAddHabit = () => {
    setCurrentHabit(null);
    setNewHabitName("");
    setNewHabitDesc("");
    setHabitModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setCurrentHabit(habit);
    setNewHabitName(habit.name);
    setNewHabitDesc(habit.description);
    setHabitModalOpen(true);
  };

  const handleSaveHabit = () => {
    if (newHabitName.trim() === "") return;

    if (currentHabit) {
      // Edit existing habit
      setHabits((prev) =>
        prev.map((h) =>
          h.id === currentHabit.id
            ? { ...h, name: newHabitName, description: newHabitDesc }
            : h
        )
      );
    } else {
      // Add new habit
      const newHabit: Habit = {
        id: generateId(),
        name: newHabitName,
        description: newHabitDesc,
        color: generatePastelColor(),
        linkedResultIds: [],
      };
      setHabits((prev) => [...prev, newHabit]);
    }
    setHabitModalOpen(false);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));

    // Remove habit from results' linkedHabitIds
    setResults((prev) =>
      prev.map((r) => ({
        ...r,
        linkedHabitIds: r.linkedHabitIds.filter((id) => id !== habitId),
      }))
    );

    // Remove all entries for this habit
    setHabitEntries((prev) =>
      prev.filter((entry) => entry.habitId !== habitId)
    );
  };

  // Add/Edit Result
  const handleAddResult = () => {
    setCurrentResult(null);
    setNewResultName("");
    setNewResultDesc("");
    // setResultModalOpen(true);
  };

  const handleEditResult = (result: Result) => {
    setCurrentResult(result);
    setNewResultName(result.name);
    setNewResultDesc(result.description);
    // setResultModalOpen(true);
  };

  const handleSaveResult = () => {
    if (newResultName.trim() === "") return;

    if (currentResult) {
      // Edit existing result
      setResults((prev) =>
        prev.map((r) =>
          r.id === currentResult.id
            ? { ...r, name: newResultName, description: newResultDesc }
            : r
        )
      );
    } else {
      // Add new result
      const newResult: Result = {
        id: generateId(),
        name: newResultName,
        description: newResultDesc,
        color: generatePastelColor(),
        linkedHabitIds: [],
      };
      setResults((prev) => [...prev, newResult]);
    }
    // setResultModalOpen(false);
  };

  const handleDeleteResult = (resultId: string) => {
    setResults((prev) => prev.filter((r) => r.id !== resultId));

    // Remove result from habits' linkedResultIds
    setHabits((prev) =>
      prev.map((h) => ({
        ...h,
        linkedResultIds: h.linkedResultIds.filter((id) => id !== resultId),
      }))
    );

    // Remove all entries for this result
    setResultEntries((prev) =>
      prev.filter((entry) => entry.resultId !== resultId)
    );
  };

  // Toggle Habit Completion
  const toggleHabitCompletion = (habitId: string) => {
    const existingEntryIndex = habitEntries.findIndex(
      (entry) => entry.habitId === habitId && entry.date === dateStr
    );

    if (existingEntryIndex >= 0) {
      // Toggle existing entry
      setHabitEntries((prev) =>
        prev.map((entry, index) =>
          index === existingEntryIndex
            ? { ...entry, completed: !entry.completed }
            : entry
        )
      );
    } else {
      // Create new completed entry
      setHabitEntries((prev) => [
        ...prev,
        { habitId, date: dateStr, completed: true },
      ]);
    }
  };

  // Update Result Value
  const handleResultValueChange = (resultId: string, value: number) => {
    const existingEntryIndex = resultEntries.findIndex(
      (entry) => entry.resultId === resultId && entry.date === dateStr
    );

    if (existingEntryIndex >= 0) {
      // Update existing entry
      setResultEntries((prev) =>
        prev.map((entry, index) =>
          index === existingEntryIndex ? { ...entry, value } : entry
        )
      );
    } else {
      // Create new entry
      setResultEntries((prev) => [...prev, { resultId, date: dateStr, value }]);
    }
  };

  // Link Habits to Results
  const handleOpenHabitLinkModal = (habit: Habit) => {
    setCurrentHabit(habit);
    // setHabitLinkModalOpen(true);
  };

  const handleLinkHabitToResult = (resultId: string, checked: boolean) => {
    if (!currentHabit) return;

    // Update habit's linked results
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== currentHabit.id) return h;

        return {
          ...h,
          linkedResultIds: checked
            ? [...h.linkedResultIds, resultId]
            : h.linkedResultIds.filter((id) => id !== resultId),
        };
      })
    );

    // Update result's linked habits
    setResults((prev) =>
      prev.map((r) => {
        if (r.id !== resultId) return r;

        return {
          ...r,
          linkedHabitIds: checked
            ? [...r.linkedHabitIds, currentHabit.id]
            : r.linkedHabitIds.filter((id) => id !== currentHabit.id),
        };
      })
    );
  };

  // Open Visualization Modal
  const handleOpenVisualizationModal = (result: Result) => {
    setCurrentResult(result);
    // setVisualizationModalOpen(true);
  };

  // Get habit completion for current date
  const getHabitCompletionForDate = useCallback(
    (habitId: string, date: string): boolean => {
      const entry = habitEntries.find(
        (e) => e.habitId === habitId && e.date === date
      );
      return entry ? entry.completed : false;
    },
    [habitEntries]
  );

  // Get result value for current date
  const getResultValueForDate = useCallback(
    (resultId: string, date: string): number => {
      const entry = resultEntries.find(
        (e) => e.resultId === resultId && e.date === date
      );
      return entry ? entry.value : 0;
    },
    [resultEntries]
  );

  // Prepare visualization data for the selected result
  const visualizationData = useMemo(() => {
    if (!currentResult) return [];

    // Get all dates with either habit or result entries
    const allEntryDates = new Set([
      ...habitEntries
        .filter((e) => currentResult.linkedHabitIds.includes(e.habitId))
        .map((e) => e.date),
      ...resultEntries
        .filter((e) => e.resultId === currentResult.id)
        .map((e) => e.date),
    ]);

    // Sort dates
    const sortedDates = Array.from(allEntryDates).sort();

    return sortedDates.map((date) => {
      const dataPoint: any = {
        date,
        displayDate: format(parseISO(date), "MMM d"),
        resultValue: getResultValueForDate(currentResult.id, date),
      };

      // Add habit completion data
      currentResult.linkedHabitIds.forEach((habitId) => {
        const habit = habits.find((h) => h.id === habitId);
        if (habit) {
          dataPoint[`habit_${habitId}`] = getHabitCompletionForDate(
            habitId,
            date
          )
            ? 1
            : 0;
          dataPoint[`habit_${habitId}_name`] = habit.name;
        }
      });

      // Calculate habit completion rate
      const totalHabits = currentResult.linkedHabitIds.length;
      const completedHabits = currentResult.linkedHabitIds.reduce(
        (sum, habitId) =>
          sum + (getHabitCompletionForDate(habitId, date) ? 1 : 0),
        0
      );

      dataPoint.habitCompletionRate =
        totalHabits > 0
          ? (completedHabits / totalHabits) * 5 // Scale to 0-5 range
          : 0;

      return dataPoint;
    });
  }, [
    currentResult,
    habits,
    habitEntries,
    resultEntries,
    getHabitCompletionForDate,
    getResultValueForDate,
  ]);

  // Calculate habit streak
  const getHabitStreak = useCallback(
    (habitId: string): number => {
      let streak = 0;
      let currentDate = new Date();

      while (true) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const isCompleted = getHabitCompletionForDate(habitId, dateStr);

        if (!isCompleted) break;

        streak++;
        currentDate = subDays(currentDate, 1);
      }

      return streak;
    },
    [getHabitCompletionForDate]
  );

  // Calculate habit completion rate
  const getHabitCompletionRate = useCallback(
    (habitId: string): number => {
      const habitData = habitEntries.filter((e) => e.habitId === habitId);
      if (habitData.length === 0) return 0;

      const completedCount = habitData.filter((e) => e.completed).length;
      return (completedCount / habitData.length) * 100;
    },
    [habitEntries]
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.default,
            0.95
          )}, ${alpha(theme.palette.background.paper, 0.97)})`,
        }}
      >
        <AppBar
          position="static"
          elevation={0}
          color="transparent"
          sx={{ backdropFilter: "blur(10px)" }}
        >
          <Toolbar>
            <Typography
              variant="h5"
              component="div"
              sx={{ flexGrow: 1, fontWeight: 600 }}
            >
              <TimelineIcon
                sx={{ verticalAlign: "middle", mr: 1 }}
                color="primary"
              />
              Habit Tracker
            </Typography>
            <Box>
              <IconButton edge="end" color="primary" onClick={goToToday}>
                <TodayIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 2 }}>
          {/* Date Navigation */}
          <Paper
            elevation={2}
            sx={{
              p: 2,
              mb: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: `linear-gradient(90deg, ${alpha(
                theme.palette.primary.light,
                0.1
              )}, ${alpha(theme.palette.primary.main, 0.2)})`,
              borderRadius: 2,
            }}
          >
            <IconButton onClick={goToPreviousDay} color="primary" size="large">
              <ChevronLeftIcon />
            </IconButton>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: "medium", mx: 1 }}>
                {formattedDate}
              </Typography>
              <DatePicker
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { display: "none" },
                  },
                  openPickerButton: {
                    color: "primary",
                  },
                }}
              />
            </Box>

            <IconButton onClick={goToNextDay} color="primary" size="large">
              <ChevronRightIcon />
            </IconButton>
          </Paper>

          {/* Tab Navigation */}
          <Paper
            elevation={3}
            sx={{ mb: 4, borderRadius: 2, overflow: "hidden" }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab icon={<CheckCircleIcon />} label="HABITS" />
              <Tab icon={<InsertChartIcon />} label="RESULTS" />
            </Tabs>
          </Paper>

          {/* Habits Tab */}
          {activeTab === 0 && (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                  Your Habits
                </Typography>
                <Tooltip title="Add New Habit">
                  <Fab size="small" color="primary" onClick={handleAddHabit}>
                    <AddIcon />
                  </Fab>
                </Tooltip>
              </Box>

              {habits.length === 0 ? (
                <Paper
                  elevation={2}
                  sx={{
                    p: 4,
                    textAlign: "center",
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  }}
                >
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No habits created yet
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddHabit}
                    sx={{ mt: 1 }}
                  >
                    Create Your First Habit
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {habits.map((habit) => {
                    const isCompleted = getHabitCompletionForDate(
                      habit.id,
                      dateStr
                    );
                    const streak = getHabitStreak(habit.id);
                    const completionRate = getHabitCompletionRate(habit.id);

                    return (
                      <Grid item xs={12} sm={6} md={4} key={habit.id}>
                        <Zoom in={true} style={{ transitionDelay: "100ms" }}>
                          <Card
                            elevation={2}
                            sx={{
                              position: "relative",
                              height: "100%",
                              borderLeft: `5px solid ${habit.color}`,
                              transition: "all 0.3s",
                              backgroundColor: isCompleted
                                ? alpha(habit.color, 0.1)
                                : alpha(theme.palette.background.paper, 0.85),
                              ":hover": {
                                transform: "translateY(-4px)",
                                boxShadow: 4,
                              },
                            }}
                          >
                            <CardContent sx={{ pb: 1 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  noWrap
                                  sx={{ maxWidth: "70%" }}
                                >
                                  {habit.name}
                                </Typography>
                                <Box>
                                  <Tooltip title="Link to Results">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleOpenHabitLinkModal(habit)
                                      }
                                      sx={{
                                        color:
                                          habit.linkedResultIds.length > 0
                                            ? "primary.main"
                                            : "text.secondary",
                                      }}
                                    >
                                      <Badge
                                        badgeContent={
                                          habit.linkedResultIds.length || null
                                        }
                                        color="primary"
                                      >
                                        <LinkIcon fontSize="small" />
                                      </Badge>
                                    </IconButton>
                                  </Tooltip>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditHabit(habit)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>

                              {habit.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 2 }}
                                >
                                  {habit.description}
                                </Typography>
                              )}

                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  flexWrap: "wrap",
                                  mb: 1,
                                }}
                              >
                                <Chip
                                  size="small"
                                  icon={<CheckCircleIcon />}
                                  label={`${streak} day streak`}
                                  color={streak > 0 ? "primary" : "default"}
                                  variant={streak > 0 ? "filled" : "outlined"}
                                />
                                <Chip
                                  size="small"
                                  icon={<InsertChartIcon />}
                                  label={`${Math.round(
                                    completionRate
                                  )}% completion`}
                                  color={
                                    completionRate > 70
                                      ? "success"
                                      : completionRate > 30
                                      ? "warning"
                                      : "default"
                                  }
                                  variant={
                                    completionRate > 0 ? "filled" : "outlined"
                                  }
                                />
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  mt: 2,
                                }}
                              >
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<DeleteIcon />}
                                  onClick={() => handleDeleteHabit(habit.id)}
                                >
                                  Delete
                                </Button>
                                <Button
                                  variant={
                                    isCompleted ? "outlined" : "contained"
                                  }
                                  color={isCompleted ? "success" : "primary"}
                                  size="small"
                                  endIcon={
                                    isCompleted ? <CheckCircleIcon /> : null
                                  }
                                  onClick={() =>
                                    toggleHabitCompletion(habit.id)
                                  }
                                >
                                  {isCompleted ? "Completed" : "Mark Complete"}
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Zoom>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </>
          )}

          {/* Results Tab */}
          {activeTab === 1 && (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                  Your Results
                </Typography>
                <Tooltip title="Add New Result">
                  <Fab size="small" color="primary" onClick={handleAddResult}>
                    <AddIcon />
                  </Fab>
                </Tooltip>
              </Box>

              {results.length === 0 ? (
                <Paper
                  elevation={2}
                  sx={{
                    p: 4,
                    textAlign: "center",
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  }}
                >
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No results created yet
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddResult}
                    sx={{ mt: 1 }}
                  >
                    Create Your First Result
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {results.map((result) => {
                    const currentValue = getResultValueForDate(
                      result.id,
                      dateStr
                    );
                    const linkedHabits = habits.filter((h) =>
                      result.linkedHabitIds.includes(h.id)
                    );
                    const completedHabitsToday = linkedHabits.filter((h) =>
                      getHabitCompletionForDate(h.id, dateStr)
                    ).length;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={result.id}>
                        <Zoom in={true} style={{ transitionDelay: "150ms" }}>
                          <Card
                            elevation={2}
                            sx={{
                              position: "relative",
                              borderLeft: `5px solid ${result.color}`,
                              transition: "all 0.3s",
                              backgroundColor:
                                currentValue > 0
                                  ? alpha(result.color, 0.1)
                                  : alpha(theme.palette.background.paper, 0.85),
                              ":hover": {
                                transform: "translateY(-4px)",
                                boxShadow: 4,
                              },
                            }}
                          >
                            <CardContent>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  noWrap
                                  sx={{ maxWidth: "70%" }}
                                >
                                  {result.name}
                                </Typography>
                                <Box>
                                  <Tooltip title="View Visualizations">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleOpenVisualizationModal(result)
                                      }
                                      color="primary"
                                    >
                                      <TimelineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditResult(result)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>

                              {result.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 2 }}
                                >
                                  {result.description}
                                </Typography>
                              )}

                              <Box sx={{ mb: 1 }}>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  gutterBottom
                                >
                                  Rate today's result (0-5):
                                </Typography>
                                <Rating
                                  name={`result-${result.id}`}
                                  value={currentValue}
                                  onChange={(_, value) =>
                                    handleResultValueChange(
                                      result.id,
                                      value || 0
                                    )
                                  }
                                  precision={1}
                                  size="large"
                                  sx={{
                                    "& .MuiRating-iconFilled": {
                                      color: result.color,
                                    },
                                  }}
                                />
                              </Box>

                              <Divider sx={{ my: 1.5 }} />

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                gutterBottom
                              >
                                Linked Habits:{" "}
                                {linkedHabits.length > 0
                                  ? `${completedHabitsToday}/${linkedHabits.length} completed today`
                                  : "None"}
                              </Typography>

                              {linkedHabits.length > 0 && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.5,
                                    mb: 2,
                                  }}
                                >
                                  {linkedHabits.map((habit) => {
                                    const isCompleted =
                                      getHabitCompletionForDate(
                                        habit.id,
                                        dateStr
                                      );
                                    return (
                                      <Chip
                                        key={habit.id}
                                        size="small"
                                        label={habit.name}
                                        icon={
                                          isCompleted ? (
                                            <CheckCircleIcon />
                                          ) : (
                                            <CancelIcon />
                                          )
                                        }
                                        color={
                                          isCompleted ? "success" : "default"
                                        }
                                        variant={
                                          isCompleted ? "filled" : "outlined"
                                        }
                                        sx={{ borderColor: habit.color }}
                                      />
                                    );
                                  })}
                                </Box>
                              )}

                              <Box
                                sx={{
                                  mt: 1,
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<DeleteIcon />}
                                  onClick={() => handleDeleteResult(result.id)}
                                >
                                  Delete
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  size="small"
                                  endIcon={<TimelineIcon />}
                                  onClick={() =>
                                    handleOpenVisualizationModal(result)
                                  }
                                >
                                  Visualize
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Zoom>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </>
          )}
        </Container>

        {/* Add/Edit Habit Modal */}
        <Dialog
          open={habitModalOpen}
          onClose={() => setHabitModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {currentHabit ? "Edit Habit" : "Add New Habit"}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Habit Name"
              fullWidth
              variant="outlined"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHabitModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddHabit}>Add Habit</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}

export default App;
