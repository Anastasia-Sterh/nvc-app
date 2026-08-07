export type GoalId = 'self' | 'negotiate' | 'boundaries'

export interface LearningGoal {
  id: GoalId
  title: string
  description: string
  available: boolean
}

export const learningGoals: LearningGoal[] = [
  {
    id: 'self',
    title: 'Понять себя и быть услышанным',
    description:
      'Говорим о чувствах и потребностях без ссор и обвинений',
    available: true,
  },
  {
    id: 'negotiate',
    title: 'Договариваться и достигать целей',
    description:
      'Ищем решения win-win и ведем конструктивный диалог',
    available: false,
  },
  {
    id: 'boundaries',
    title: 'Уверенно отстаивать границы',
    description:
      'Твердо говорим «нет» и просим о важном без чувства вины',
    available: false,
  },
]
