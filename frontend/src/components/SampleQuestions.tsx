
const SampleQuestions = ({ setInput }) => {
    return (
        <div className='flex flex-col gap-4'>
            <button
                onClick={() => setInput("What was the voting outcome for this bill?")}
                className="w-full text-left p-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
            >
                What was the voting outcome for this bill?
            </button>
            <button
                onClick={() => setInput("How does this bill relate to the previous mining regulations?")}
                className="w-full text-left p-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
            >
                How does this bill relate to the previous mining regulations?
            </button>
        </div>
    )
}

export default SampleQuestions