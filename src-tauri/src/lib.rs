use std::process::Command;
use std::thread;
use std::time::Duration;
use tauri::Manager;

#[cfg(not(debug_assertions))]
fn start_next_server() {
    thread::spawn(|| {
        let mut attempts = 0;
        loop {
            attempts += 1;
            let child = Command::new("node")
                .current_dir(".next/standalone")
                .args(["server.js"])
                .spawn();

            match child {
                Ok(mut proc) => {
                    println!("Next.js server started with PID: {}", proc.id());
                    let _ = proc.wait();
                    eprintln!("Next.js server exited, restarting...");
                }
                Err(e) => {
                    eprintln!("Failed to start Next.js server: {}", e);
                }
            }

            if attempts > 10 {
                eprintln!("Too many restart attempts, giving up");
                break;
            }

            thread::sleep(Duration::from_secs(2));
        }
    });
}

#[cfg(debug_assertions)]
fn start_next_server() {}

#[cfg(not(debug_assertions))]
fn wait_for_server() {
    println!("Waiting for Next.js server to be ready...");
    for i in 0..30 {
        thread::sleep(Duration::from_secs(1));
        if std::net::TcpStream::connect("127.0.0.1:3000").is_ok() {
            println!("Server is ready!");
            return;
        }
        println!("Still waiting... ({})", i + 1);
    }
    eprintln!("Server did not become ready in time");
}

#[cfg(debug_assertions)]
fn wait_for_server() {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    start_next_server();
    wait_for_server();

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            #[cfg(not(debug_assertions))]
            {
                let window = app.get_webview_window("main").unwrap();
                window
                    .eval("window.location.href = 'http://localhost:3000';")
                    .ok();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
