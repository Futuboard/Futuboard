beforeEach(() => {
  cy.visit("http://localhost:5173")
})

const defaultColumn = {
  title: "To Do"
}

const otherColumn = {
  title: "Something else"
}

const defaultTask = {
  title: "Design Homepage",
  size: "3",
  description: "Create a mockup for the homepage",
  cornerNote: "Urgent"
}

const otherTask = {
  title: "Research Competitors",
  size: "2",
  description: "Analyze competitor websites for features and design",
  cornerNote: "Normal"
}

describe("At the Futuboard home page", () => {
  it("has the correct title", () => {
    cy.get(".MuiTypography-root").should("contain", "Futuboard")
  })

  it("can create board and log in ", () => {
    cy.createBoard()
    cy.loginToBoard("alpha123")
    cy.contains("Add a column")
  })
})

describe("In a board", () => {
  beforeEach(() => {
    cy.createBoard()
    cy.loginToBoard("alpha123")
  })

  it("can create a column", () => {
    cy.createColumn(defaultColumn)

    cy.contains("To Do")
    cy.contains("No cards yet")
    cy.get("p[title='Number of tasks']").contains("0")
    cy.get("p[title='Total size of tasks']").contains("0")
  })

  it("can edit a column", () => {
    cy.createColumn(defaultColumn)

    cy.get('[data-testid="EditIcon"]').click()
    cy.get('[name="columnTitle"]').clear().type("Some other title")
    cy.get('[name="columnWipLimit"]').type("5")
    cy.get('[name="columnWipLimitStory"]').type("8")
    cy.contains("Submit").click()

    cy.contains("Some other title")
    cy.contains("To Do").should("not.exist")
    cy.get("p[title='Number of tasks']").contains("0 / 5")
    cy.get("p[title='Total size of tasks']").contains("0 / 8")
  })

  it("can add tasks", () => {
    cy.createColumn(defaultColumn)
    cy.createTask(defaultTask)
    cy.createTask(otherTask)

    cy.get("strong").contains(defaultTask.title)
    cy.get("strong").contains(otherTask.title)
  })

  it("can edit a task", () => {
    cy.createColumn(defaultColumn)
    cy.createTask(defaultTask)
    cy.editTask(otherTask)

    cy.get("strong").contains(otherTask.title)
    cy.get("strong").contains(defaultTask.title).should("not.exist")
  })

  it("can add users", () => {
    cy.createUser({ name: "Antonio", buttonIndex: 0 })
    cy.createUser({ name: "Samuli", buttonIndex: 0 })
    cy.createUser({ name: "Alex", buttonIndex: 1 })

    cy.contains("Antonio")
    cy.contains("Samuli")
    cy.contains("Alex")
  })

  it("can export and import board", () => {
    cy.createColumn(defaultColumn)
    cy.createTask(defaultTask)
    cy.createTask(otherTask)
    cy.createColumn(otherColumn)
    cy.createUser({ name: "Antonio", buttonIndex: 0 })
    cy.createUser({ name: "Samuli", buttonIndex: 0 })

    cy.get('[data-testid="MoreVertIcon"]').click()
    cy.get('[data-testid="DownloadIcon"]').click()

    const date = new Date()
    const fileName = `Project Alpha-${date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/[^a-zA-Z0-9]/g, "_")}.csv`
    const filePath = `downloads/${fileName}`

    cy.readFile(filePath).should("exist")

    cy.get("button[aria-label='Home']").click()

    cy.contains("Create board").click()

    cy.get("input[name='title']").type("Imported test Board")
    cy.get("input[name='password']").type("password")
    cy.get("input[type='file']").selectFile(filePath, { force: true })
    cy.get("button").contains("Submit").click()

    cy.loginToBoard("password")

    cy.contains("Imported test Board")
    cy.contains(defaultTask.title)
    cy.contains(otherTask.title)
    cy.contains("Antonio")
    cy.contains("Samuli")
  })

  it("can delete a board", () => {
    cy.createColumn(defaultColumn)
    cy.createUser({ name: "Antonio", buttonIndex: 0 })
    cy.createTask(defaultTask)

    cy.get('[data-testid="MoreVertIcon"]').click()
    cy.get('[data-testid="DeleteIcon"]').click()
    cy.get(".MuiDialog-root").find("label").contains("Password").parent().find("input").type("alpha123")
    cy.get(".MuiDialog-root").contains("button", "Submit").click()
    cy.get("button").contains("Confirm Deletion").click()

    cy.contains("Futuboard")
    cy.contains("Antonio").should("not.exist")
    cy.contains("Create board")
  })
})

describe("When working with multiple users", () => {
  it("can see changes made by other users and own updates are responsive", () => {
    // Import board with data, so responsivess is tested more realistically
    cy.contains("Create board").click()
    cy.get("input[name='title']").type("Imported test Board")
    cy.get("input[name='password']").type("alpha123")
    cy.get("input[type='file']").selectFile("fixtures/large_board.csv", { force: true })
    cy.get("button").contains("Submit").click()

    cy.loginToBoard("alpha123")

    cy.contains("Imported test Board")

    cy.contains("about this board")
    cy.contains("pokemon31-40")
    cy.contains("pikachu")
    cy.contains("Jess")

    // Only testing with 5 concurrent users, because all browser are running on the same machine.
    // With more users, test becomes flaky.
    const concurrentUsers = 5

    // Check that board doesn't contain data that it shouldn't contain yet

    for (let i = 0; i < concurrentUsers; i++) {
      cy.contains(`To Do (${i})`).should("not.exist")
      cy.contains(`Card (${i})`).should("not.exist")
    }

    cy.contains("Something else").should("not.exist")
    cy.contains("Research Competitors").should("not.exist")

    // Test that updates from other users are responsive

    cy.url().then((url) => {
      cy.task("stress-test", { boardUrl: url, concurrentUsers })
    })

    for (let i = 0; i < concurrentUsers; i++) {
      cy.contains(`To Do (${i})`)
      cy.contains(`Card (${i})`)
    }

    // Test own updates are responsive, when board in use

    cy.createColumn(otherColumn)
    cy.contains("Something else")

    cy.createTask(otherTask)
    cy.contains("Research Competitors")
  })
})
