// Because the client side socketio library has been loaded in index.html -> chat.js has access to the functions in socket.io

// To connect to the server
// const socket = io() // return value -> to send to/receive from server

// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated!', count)
// })

// increment = () => {
//     console.log('Clicked')

//     // Sending data from client to server
//     socket.emit('increment')
// }

const socket = io()


// Convention -> $ -> Part of DOM
// Element
const $messageForm = document.querySelector('#message-form')
const $message = $messageForm.querySelector('input')
const $sendButton = $messageForm.querySelector('button')
const $locButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const msgTemplate = document.querySelector('#message-template').innerHTML
const locTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMsgStyles = getComputedStyle($newMessage)
    const newMsgMargin = parseInt(newMsgStyles.marginBottom)
    const newMsgHeight = $newMessage.offsetHeight + newMsgMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have we scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMsgHeight <= scrollOffset)
        $messages.scrollTop = $messages.scrollHeight
}

socket.on('message', (message) => {
    // console.log(message)
    const html = Mustache.render(msgTemplate, {
        // Key-Value paris we want to access
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('LT')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    // console.log(url)
    const html = Mustache.render(locTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('LT')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error),
        location.href = '/'
    }
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault()

    $sendButton.setAttribute('disabled', 'disabled') // attribute: value
    // disable the form
    const message = event.target.elements.message.value // message is the name provided to 'input' field

    socket.emit('sendMessage', message, (error) => { // Acknowledgement
   
        // Re-enable
        $sendButton.removeAttribute('disabled')
        // Clear the input
        $message.value = ''
        // Re-focus
        $message.focus()

        if (error) 
            return console.log(error)
        //console.log('Delivered')
    })
})

$locButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    // Disable
    $locButton.setAttribute('disabled', 'disaled')

    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit('sendLocation', { 
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude 
        }, (success) => {
            if (success) {
                $locButton.removeAttribute('disabled')
                console.log(success)}
        })
    })

})