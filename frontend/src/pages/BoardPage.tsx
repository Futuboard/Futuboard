import BoardContainer from "@/components/board/BoardContainer"
import LoggedInContainer from "@/components/LoggedInContainer"

const ChartsContainer = () => {
  return <LoggedInContainer>{(props) => <BoardContainer board={props.board} />}</LoggedInContainer>
}

export default ChartsContainer
