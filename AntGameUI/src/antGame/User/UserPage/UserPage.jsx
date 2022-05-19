import {useEffect} from "react"

export const UserPage = ({id}) => {

    useEffect(() => {
        console.log(id)
    }, [id])

    return (
        <div>
            {id}
        </div>
    )
}